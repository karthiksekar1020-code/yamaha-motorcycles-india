import { adminRoute, audit, readJson } from "@/lib/admin/api";
import { HttpError } from "@/lib/admin/errors";
import { mfaEnrollVerifySchema, mfaRemoveSchema } from "@/lib/admin/schemas";

export const dynamic = "force-dynamic";

/** Starts setting up an authenticator app: returns the QR code and the manual key to show once. */
export const POST = adminRoute(async (ctx) => {
  const factors = await ctx.supabase.auth.mfa.listFactors();
  if (factors.data?.totp?.length) throw new HttpError(409, "ALREADY_ENROLLED", "Two-step sign-in is already on. Turn it off first to set it up again.");
  // Clear any half-finished attempt from before.
  for (const f of factors.data?.all ?? []) if (f.status === "unverified") await ctx.supabase.auth.mfa.unenroll({ factorId: f.id });
  const { data, error } = await ctx.supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Owner ${new Date().toISOString().slice(0, 10)}` });
  if (error || !data) throw new HttpError(500, "ENROLL_FAILED", "Could not start two-step setup.");
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
});

/** Finishes setup by proving the app produces a valid code. */
export const PUT = adminRoute(async (ctx) => {
  const { factorId, code } = await readJson(ctx.req, mfaEnrollVerifySchema, 1_000);
  const { error } = await ctx.supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) throw new HttpError(422, "INVALID_CODE", "That code is not correct. Check the time on your phone and try again.", { code: "Incorrect or expired" });
  await audit(ctx, "auth.mfa_enabled", "admin", ctx.user.id);
  return { ok: true };
});

/** Turns two-step sign-in off. requireAdmin() already demanded a fully verified (two-step) session for this call. */
export const DELETE = adminRoute(async (ctx) => {
  const { factorId } = await readJson(ctx.req, mfaRemoveSchema, 1_000);
  const { error } = await ctx.supabase.auth.mfa.unenroll({ factorId });
  if (error) throw new HttpError(422, "REMOVE_FAILED", "Could not turn off two-step sign-in.");
  await audit(ctx, "auth.mfa_disabled", "admin", ctx.user.id);
  return { ok: true };
});
