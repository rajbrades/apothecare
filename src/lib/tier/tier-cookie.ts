import { type NextRequest, NextResponse } from "next/server";

const TIER_COOKIE_NAME = "x-tier";
/** 1 hour — forces periodic refresh so upgrades propagate without invalidation */
const TIER_COOKIE_MAX_AGE = 60 * 60;

export function setTierCookie(response: NextResponse, tier: string) {
  response.cookies.set(TIER_COOKIE_NAME, tier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TIER_COOKIE_MAX_AGE,
  });
}

export function getTierFromCookie(request: NextRequest): string | null {
  return request.cookies.get(TIER_COOKIE_NAME)?.value ?? null;
}

export function deleteTierCookie(response: NextResponse) {
  response.cookies.delete(TIER_COOKIE_NAME);
}
