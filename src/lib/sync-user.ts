import { createHash } from 'node:crypto';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Prisma } from '@/generated/prisma';
import prisma from './prisma';

/**
 * Supabase auth user -> Prisma `User` sync, shared by every sign-in path
 * (web OAuth callback, server OTP verify, GET /api/auth/me for mobile, and
 * getAuthUser()). Keeping it in one place means the welcome bonus and the
 * deleted-account tombstone check apply everywhere.
 */

/** Coins granted to a brand-new account (same as the web sign-up paths). */
export const WELCOME_BONUS_COINS = 50;

/** The user fields returned by /api/auth/me and /api/auth/otp/verify. */
export const syncedUserSelect = {
  id: true,
  phone: true,
  email: true,
  name: true,
  avatar: true,
  locale: true,
  provider: true,
  coinBalance: true,
} satisfies Prisma.UserSelect;

export type SyncedUser = Prisma.UserGetPayload<{ select: typeof syncedUserSelect }>;

/** '+' followed by the digits of `p`, or null when there are no digits. */
export function normalizePhone(p?: string | null): string | null {
  if (!p) return null;
  const digits = p.replace(/\D/g, '');
  return digits ? `+${digits}` : null;
}

/**
 * Both stored forms of a phone number: '+919876543210' (what our own sign-up
 * paths write) and '919876543210' (what Supabase Auth reports in user.phone).
 */
export function phoneVariants(p?: string | null): string[] {
  const normalized = normalizePhone(p);
  return normalized ? [normalized, normalized.slice(1)] : [];
}

function emailVariants(e?: string | null): string[] {
  if (!e) return [];
  return Array.from(new Set([e, e.toLowerCase()]));
}

/**
 * sha256 tombstone hashes for a deleted account's identifiers. Only hashes are
 * stored, never the raw phone/email.
 */
export function identityHashes(phone?: string | null, email?: string | null): string[] {
  const hashes: string[] = [];
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone) {
    hashes.push(createHash('sha256').update(`phone:${normalizedPhone}`).digest('hex'));
  }
  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) {
    hashes.push(createHash('sha256').update(`email:${normalizedEmail}`).digest('hex'));
  }
  return hashes;
}

/**
 * True when a Prisma error means a table/column is missing — i.e. a migration
 * (such as mobile_hardening) has not been applied to this database yet.
 */
export function isMissingTableError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2021' || err.code === 'P2022') return true;
  }
  const message = err instanceof Error ? err.message : String(err);
  return /does not exist/i.test(message);
}

/**
 * Prisma `where` matching any record that belongs to this Supabase user
 * (by supabaseId, email in either case, or phone in either stored form).
 */
export function supabaseUserWhere(su: SupabaseUser): Prisma.UserWhereInput {
  const emails = emailVariants(su.email);
  const phones = phoneVariants(su.phone);
  return {
    OR: [
      { supabaseId: su.id },
      ...(emails.length ? [{ email: { in: emails } }] : []),
      ...(phones.length ? [{ phone: { in: phones } }] : []),
    ],
  };
}

type FoundUser = SyncedUser & { supabaseId: string | null };

const lookupSelect = { ...syncedUserSelect, supabaseId: true } satisfies Prisma.UserSelect;

/** Priority lookup: supabaseId, then email, then phone. */
async function findExisting(su: SupabaseUser): Promise<FoundUser | null> {
  const bySupabaseId = await prisma.user.findFirst({
    where: { supabaseId: su.id },
    select: lookupSelect,
  });
  if (bySupabaseId) return bySupabaseId;

  const emails = emailVariants(su.email);
  if (emails.length) {
    const byEmail = await prisma.user.findFirst({
      where: { email: { in: emails } },
      select: lookupSelect,
    });
    if (byEmail) return byEmail;
  }

  const phones = phoneVariants(su.phone);
  if (phones.length) {
    const byPhone = await prisma.user.findFirst({
      where: { phone: { in: phones } },
      select: lookupSelect,
    });
    if (byPhone) return byPhone;
  }

  return null;
}

function metaString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function profileFromMetadata(su: SupabaseUser) {
  const meta = (su.user_metadata ?? {}) as Record<string, unknown>;
  return {
    name:
      metaString(meta.full_name) ?? metaString(meta.name) ?? metaString(meta.user_name),
    avatar: metaString(meta.avatar_url) ?? metaString(meta.picture),
    locale: metaString(meta.locale) ?? 'en',
  };
}

async function welcomeBonusAllowed(su: SupabaseUser): Promise<boolean> {
  const hashes = identityHashes(su.phone, su.email);
  if (!hashes.length) return true;
  try {
    const tombstone = await prisma.deletedIdentity.findFirst({
      where: { hash: { in: hashes } },
      select: { hash: true },
    });
    return !tombstone;
  } catch (err) {
    // Missing table (migration not applied yet) or a transient failure:
    // don't block sign-up, just grant the bonus as before.
    console.warn(
      '[sync-user] DeletedIdentity lookup failed; granting welcome bonus:',
      isMissingTableError(err) ? 'table does not exist' : err
    );
    return true;
  }
}

export interface SyncOptions {
  /**
   * Provider to record for a new user, or when linking a legacy record
   * (defaults to app_metadata.provider, else 'phone' when there is a phone).
   */
  provider?: string;
  /**
   * Overwrite name/avatar/email/provider with the latest values from the auth
   * provider (the web OAuth callback's historical behaviour). By default only
   * missing (null) fields are filled in.
   */
  refreshProfile?: boolean;
}

async function updateExisting(
  existing: FoundUser,
  su: SupabaseUser,
  opts: SyncOptions
): Promise<SyncedUser> {
  const { name, avatar } = profileFromMetadata(su);
  const data: Prisma.UserUpdateInput = {};

  if (!existing.supabaseId) {
    data.supabaseId = su.id;
    if (opts.provider) data.provider = opts.provider;
  }

  if (opts.refreshProfile) {
    // Historical OAuth-callback behaviour: the record follows the latest
    // Supabase identity that signed in with this email.
    if (existing.supabaseId && existing.supabaseId !== su.id) data.supabaseId = su.id;
    const provider = opts.provider ?? su.app_metadata?.provider;
    if (provider && provider !== existing.provider) data.provider = provider;
    if (su.email && su.email !== existing.email) data.email = su.email;
    if (name && name !== existing.name) data.name = name;
    if (avatar && avatar !== existing.avatar) data.avatar = avatar;
  } else {
    if (name && !existing.name) data.name = name;
    if (avatar && !existing.avatar) data.avatar = avatar;
  }

  const current: SyncedUser = {
    id: existing.id,
    phone: existing.phone,
    email: existing.email,
    name: existing.name,
    avatar: existing.avatar,
    locale: existing.locale,
    provider: existing.provider,
    coinBalance: existing.coinBalance,
  };
  if (Object.keys(data).length === 0) return current;

  try {
    return await prisma.user.update({
      where: { id: existing.id },
      data,
      select: syncedUserSelect,
    });
  } catch (err) {
    // e.g. the provider's email already belongs to another record. The user
    // is still signed in; serve the record as-is rather than failing.
    console.error('[sync-user] profile update failed:', err);
    return current;
  }
}

async function createNew(su: SupabaseUser, opts: SyncOptions): Promise<SyncedUser> {
  const phone = normalizePhone(su.phone);
  const { name, avatar, locale } = profileFromMetadata(su);
  const bonusAllowed = await welcomeBonusAllowed(su);

  return prisma.user.create({
    data: {
      supabaseId: su.id,
      phone,
      email: su.email || null,
      name,
      avatar,
      locale,
      provider: opts.provider ?? su.app_metadata?.provider ?? (phone ? 'phone' : null),
      coinBalance: bonusAllowed ? WELCOME_BONUS_COINS : 0,
      ...(bonusAllowed
        ? {
            coinTransactions: {
              create: {
                amount: WELCOME_BONUS_COINS,
                type: 'BONUS',
                description: 'Welcome bonus',
                providerRef: `welcome:${su.id}`,
              },
            },
          }
        : {}),
    },
    select: syncedUserSelect,
  });
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

/**
 * Find (or create) the Prisma user for a Supabase auth user.
 *
 * - Existing record (by supabaseId, then email, then phone): backfills
 *   supabaseId and fills missing name/avatar (or refreshes the profile when
 *   `refreshProfile` is set).
 * - New record: created with the welcome bonus, unless the phone/email
 *   matches a deleted-account tombstone.
 * - A concurrent sign-in racing us to the insert (P2002) is resolved by
 *   looking the record up once more.
 */
export async function syncPrismaUser(
  su: SupabaseUser,
  opts: SyncOptions = {}
): Promise<SyncedUser> {
  const existing = await findExisting(su);
  if (existing) return updateExisting(existing, su, opts);

  try {
    return await createNew(su, opts);
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    const raced = await findExisting(su);
    if (!raced) throw err;
    return updateExisting(raced, su, opts);
  }
}
