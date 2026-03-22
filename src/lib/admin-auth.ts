import { createServerSupabaseClient } from './supabase-server';
import prisma from './prisma';

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser) return null;

  const user = await prisma.user.findFirst({
    where: { supabaseId: supabaseUser.id }
  });

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return null;

  return user;
}
