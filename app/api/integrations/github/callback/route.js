import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/integrations?error=${error}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/integrations?error=no_code", req.url)
      );
    }

    // Redirect to integrations page with code
    return NextResponse.redirect(
      new URL(`/integrations?code=${code}`, req.url)
    );
  } catch (error) {
    console.error("GitHub callback error:", error);
    return NextResponse.redirect(
      new URL("/integrations?error=callback_failed", req.url)
    );
  }
}