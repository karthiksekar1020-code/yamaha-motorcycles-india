import { NextResponse } from "next/server";

/** An error that is safe to show to the caller. Anything else becomes a generic 500 and is only logged. */
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

export const unauthenticated = () => new HttpError(401, "UNAUTHENTICATED", "Sign in to continue.");
export const forbidden = () => new HttpError(403, "FORBIDDEN", "You do not have permission to do this.");
export const notFound = (what = "Item") => new HttpError(404, "NOT_FOUND", `${what} not found.`);

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: { code: e.code, message: e.message, ...(e.fields ? { fields: e.fields } : {}) } }, { status: e.status, headers: { "Cache-Control": "no-store" } });
  }
  // Log the class of failure only: never request bodies, tokens or database internals.
  console.error("[admin] unexpected error:", e instanceof Error ? e.name : typeof e);
  return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." } }, { status: 500, headers: { "Cache-Control": "no-store" } });
}
