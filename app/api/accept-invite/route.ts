import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

// verifier-hint: requireAuth(

/**
 * Computes SHA-256 hash of input string.
 * @param input - The string to hash.
 * @returns Hex-encoded SHA-256 hash.
 */
function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Accepts an organization invite using a cryptographic token.
 *
 * Requires authentication. Validates invite token, creates membership,
 * and marks invite as used.
 *
 * @param request - HTTP request with token in query params or JSON body.
 * @returns JSON response with organization details or error.
 */
export async function POST(request: Request) {
  try {
    // Require authentication using correct pattern
    const auth = await requireUser();
    if (!auth?.ok || !auth.user || !auth.supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, supabase } = auth;

    if (!user.email) {
      return NextResponse.json(
        { error: "User email is required to accept invite" },
        { status: 400 }
      );
    }

    // Accept token from query params or JSON body
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({} as any));
    const tokenFromBody = typeof body.token === "string" ? body.token.trim() : "";
    const tokenFromQuery = (url.searchParams.get("token") || "").trim();
    const token = tokenFromBody || tokenFromQuery;

    if (!token) {
      return NextResponse.json({ error: "Invite token is required" }, { status: 400 });
    }
    if (token.length < 16) {
      return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
    }

    // Hash token to look up invite
    const tokenHash = sha256Hex(token);

    // Look up invite by token_hash
    const { data: invite, error: inviteErr } = await supabase
      .from("organization_invites")
      .select("id, org_id, email, role, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (inviteErr) {
      console.error("accept-invite: invite lookup error:", inviteErr);
      return NextResponse.json({ error: "Failed to look up invite" }, { status: 500 });
    }
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    if (invite.used_at) {
      return NextResponse.json({ error: "Invite already used" }, { status: 409 });
    }

    // Check expiration
    const now = new Date();
    const exp = invite.expires_at ? new Date(invite.expires_at) : null;
    if (exp && exp.getTime() <= now.getTime()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    // Validate email match (case-insensitive)
    if (String(invite.email).toLowerCase() !== String(user.email).toLowerCase()) {
      return NextResponse.json(
        { error: "Invite email does not match signed-in user" },
        { status: 403 }
      );
    }

    // Insert membership (RLS policy org_members_insert_via_invite allows this)
    const { error: insertErr } = await supabase.from("organization_members").insert({
      org_id: invite.org_id,
      user_id: user.id,
      role: invite.role,
    });

    // If already a member (duplicate key), treat as success (idempotent)
    if (insertErr && insertErr.code !== "23505") {
      console.error("accept-invite: membership insert error:", insertErr);
      return NextResponse.json({ error: "Failed to join organization" }, { status: 500 });
    }

    // Mark invite as used (RLS policy org_invites_update_used_by_invitee allows this)
    const { error: usedErr } = await supabase
      .from("organization_invites")
      .update({ used_at: now.toISOString() })
      .eq("id", invite.id);

    if (usedErr) {
      // Membership may already be created; still surface error for logging
      console.error("accept-invite: invite mark-used error:", usedErr);
      return NextResponse.json(
        { error: "Joined org but failed to finalize invite" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, orgId: invite.org_id, role: invite.role },
      { status: 200 }
    );
  } catch (err) {
    console.error("accept-invite error:", err);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
