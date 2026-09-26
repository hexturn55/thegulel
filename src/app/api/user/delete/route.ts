import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
  getSupabaseUser,
} from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { revokeAppleToken } from '@/lib/apple-auth';
import { identityHashes, isMissingTableError, supabaseUserWhere } from '@/lib/sync-user';

/**
 * POST /api/user/delete
 * Permanently deletes the current user's account (web cookie or mobile bearer
 * token). Body: { confirmation: "DELETE" }
 *
 * 1. Revokes the user's Sign in with Apple grant, if we hold a refresh token.
 * 2. Deletes watch history, coin transactions, episode purchases,
 *    subscription records, search logs, the ad cooldown and the user record.
 * 3. Records hashed phone/email tombstones so re-registering does not grant
 *    the welcome bonus again.
 * 4. Deletes the RevenueCat customer (best effort).
 * 5. Deletes the Supabase Auth login itself (admin API).
 *
 * Steps 1-4 are skipped when there is no app record (e.g. a retry after the
 * login deletion failed), so a retry goes straight to step 5.
 * App Store / Google Play subscriptions must still be cancelled in the store.
 */
export async function POST(request: NextRequest) {
  const supabaseUser = await getSupabaseUser();

  if (!supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { confirmation?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body?.confirmation !== 'DELETE') {
    return NextResponse.json(
      { error: 'Confirmation required. Send { confirmation: "DELETE" }' },
      { status: 400 }
    );
  }

  // ── App data ──────────────────────────────────────────────────────────────
  try {
    const dbUser = await prisma.user.findFirst({
      where: supabaseUserWhere(supabaseUser),
      select: { id: true, phone: true, email: true },
    });

    if (dbUser) {
      const userId = dbUser.id;

      await revokeAppleCredential(userId);

      await prisma.$transaction([
        prisma.watchHistory.deleteMany({ where: { userId } }),
        prisma.coinTransaction.deleteMany({ where: { userId } }),
        prisma.episodePurchase.deleteMany({ where: { userId } }),
        prisma.subscription.deleteMany({ where: { userId } }),
        // No FK/cascade on SearchLog.userId: remove the user's search queries
        // explicitly (listed as usage data in the privacy policy).
        prisma.searchLog.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
      ]);

      // Raw SQL + best effort: AdCooldown's shape differs between databases
      // created by `migrate` and by /api/admin/ops, and it may be missing.
      try {
        await prisma.$executeRaw`DELETE FROM "AdCooldown" WHERE "userId" = ${userId}`;
      } catch (err) {
        console.warn('[user/delete] AdCooldown cleanup skipped:', errorMessage(err));
      }

      await recordTombstones([
        ...identityHashes(dbUser.phone, dbUser.email),
        ...identityHashes(supabaseUser.phone, supabaseUser.email),
      ]);

      await deleteRevenueCatCustomer(userId);
    }
  } catch (error) {
    console.error('POST /api/user/delete error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  // ── Login identity ────────────────────────────────────────────────────────
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // The app data is gone and the tombstone blocks bonus farming, so report
    // success, but the login itself survives until this is configured.
    console.error(
      '[user/delete] SUPABASE_SERVICE_ROLE_KEY is not set — the Supabase Auth user ' +
        `${supabaseUser.id} was NOT deleted. Configure it and delete the login manually.`
    );
  } else {
    try {
      const admin = createAdminSupabaseClient();
      const { error } = await admin.auth.admin.deleteUser(supabaseUser.id);
      if (error && !isUserNotFound(error)) {
        console.error('[user/delete] Supabase admin deleteUser failed:', error);
        return NextResponse.json(
          { error: 'Could not delete login, please retry' },
          { status: 500 }
        );
      }
    } catch (err) {
      console.error('[user/delete] Supabase admin deleteUser threw:', err);
      return NextResponse.json(
        { error: 'Could not delete login, please retry' },
        { status: 500 }
      );
    }
  }

  // Clear the web cookie session if present (bearer-token callers clear their
  // own session locally).
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // no cookie session — nothing to sign out
  }

  return NextResponse.json({ success: true, message: 'Account deleted.' });
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isUserNotFound(error: { status?: number; code?: string; message?: string }): boolean {
  return (
    error.status === 404 ||
    error.code === 'user_not_found' ||
    /user not found/i.test(error.message ?? '')
  );
}

/** Revoke and forget the user's Sign in with Apple grant (best effort). */
async function revokeAppleCredential(userId: string): Promise<void> {
  let refreshToken: string | null = null;
  try {
    const credential = await prisma.appleCredential.findUnique({ where: { userId } });
    refreshToken = credential?.refreshToken ?? null;
  } catch (err) {
    console.warn(
      '[user/delete] AppleCredential lookup skipped:',
      isMissingTableError(err) ? 'table does not exist' : errorMessage(err)
    );
    return;
  }
  if (!refreshToken) return;

  await revokeAppleToken(refreshToken);

  try {
    await prisma.appleCredential.deleteMany({ where: { userId } });
  } catch (err) {
    console.warn('[user/delete] AppleCredential cleanup failed:', errorMessage(err));
  }
}

/** Hashed phone/email tombstones (best effort; table may not exist yet). */
async function recordTombstones(hashes: string[]): Promise<void> {
  const unique = Array.from(new Set(hashes));
  if (!unique.length) return;
  try {
    await prisma.deletedIdentity.createMany({
      data: unique.map((hash) => ({ hash })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.warn(
      '[user/delete] DeletedIdentity insert skipped:',
      isMissingTableError(err) ? 'table does not exist' : errorMessage(err)
    );
  }
}

/** Delete the RevenueCat customer record (best effort). */
async function deleteRevenueCatCustomer(userId: string): Promise<void> {
  const key = process.env.REVENUECAT_SECRET_API_KEY;
  if (!key) return;
  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${key}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      }
    );
    if (!res.ok && res.status !== 404) {
      console.warn(`[user/delete] RevenueCat delete returned ${res.status}`);
    }
  } catch (err) {
    console.warn('[user/delete] RevenueCat delete failed:', errorMessage(err));
  }
}
