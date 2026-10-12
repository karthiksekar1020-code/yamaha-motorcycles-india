import { NextResponse } from "next/server";

export interface ApiError {
  error: { code: string; message: string; fields?: Record<string, string> };
}

export function apiError(status: number, code: string, message: string, fields?: Record<string, string>, headers?: HeadersInit) {
  return NextResponse.json<ApiError>({ error: { code, message, ...(fields ? { fields } : {}) } }, { status, headers });
}
