import { cookies } from "next/headers";

export const ADMIN_COOKIE = "midi_admin_pass";

export function getAdminPass(): string | null {
  const v = process.env.ADMIN_PASS;
  return v && v.length > 0 ? v : null;
}

export async function isAdmin(): Promise<boolean> {
  const expected = getAdminPass();
  if (!expected) return false;
  const c = await cookies();
  return c.get(ADMIN_COOKIE)?.value === expected;
}
