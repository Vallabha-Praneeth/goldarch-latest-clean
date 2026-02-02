import { Resend } from "resend";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

// verifier-hint: requireAuth(

// Initialize Resend only if API key is configured (optional for testing)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const roleDisplayName = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  procurement: "Procurement Specialist",
  viewer: "Viewer",
};

const allowedRoles = new Set(Object.keys(roleDisplayName));

/**
 * Computes SHA-256 hash of input string.
 * @param {string} input - The string to hash.
 * @returns {string} Hex-encoded SHA-256 hash.
 */
function sha256Hex(input) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Creates a JSON response with the given status code.
 * @param {number} status - HTTP status code.
 * @param {object} body - Response body object.
 * @returns {NextResponse} JSON response.
 */
function json(status, body) {
  return NextResponse.json(body, { status });
}

/**
 * Derives the base URL from environment variables or request headers.
 * @param {Request} request - The incoming HTTP request.
 * @returns {string} Base URL without trailing slash.
 */
function getBaseUrl(request) {
  // Prefer explicit env if set, else derive from request headers.
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "";
  if (envUrl) return envUrl.replace(/\/+$/, "");

  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

/**
 * Validates email address format and checks for header injection.
 * @param {string} email - Email address to validate.
 * @returns {boolean} True if email is safe, false otherwise.
 */
function isSafeEmail(email) {
  if (!email) return false;
  if (email.includes("\n") || email.includes("\r")) return false;
  if (!email.includes("@")) return false;
  return true;
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - String to escape.
 * @returns {string} HTML-escaped string.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sends an organization invite email.
 *
 * Requires authentication and org owner/admin role.
 * Creates an invite record with a cryptographic token and sends email.
 *
 * @param {Request} request - HTTP request with JSON body containing:
 *   - orgId: string (uuid) - Organization ID
 *   - to: string - Recipient email address
 *   - role: string - One of: owner, admin, manager, procurement, viewer
 *   - inviterName?: string - Optional name of person sending invite
 * @returns {Promise<NextResponse>} JSON response with invite details or error.
 */
export async function POST(request) {
  try {
    const auth = await requireUser();
    if (!auth?.ok || !auth.user || !auth.supabase) {
      return json(401, { error: "unauthorized" });
    }

    const supabase = auth.supabase;
    const user = auth.user;

    const body = await request.json().catch(() => ({}));
    const orgId = typeof body.orgId === "string" ? body.orgId.trim() : "";
    const to = typeof body.to === "string" ? body.to.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "viewer";
    const inviterNameRaw = typeof body.inviterName === "string" ? body.inviterName.trim() : "";

    if (!orgId) return json(400, { error: "orgId is required" });
    if (!to) return json(400, { error: "Recipient email is required" });
    if (!isSafeEmail(to)) return json(400, { error: "Invalid recipient email" });
    if (!allowedRoles.has(role)) return json(400, { error: "Invalid role" });

    // Authorization: must be owner/admin of org.
    const { data: me, error: meErr } = await supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (meErr) return json(500, { error: "db_error", message: meErr.message });
    if (!me || !["owner", "admin"].includes(me.role)) {
      return json(403, { error: "forbidden" });
    }

    // Create invite record.
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256Hex(token);

    const inviteRow = {
      org_id: orgId,
      email: to,
      role,
      token_hash: tokenHash,
      // expires_at default in DB (7 days)
      // created_by default auth.uid()
    };

    const { data: invite, error: inviteErr } = await supabase
      .from("organization_invites")
      .insert(inviteRow)
      .select("id, org_id, email, role, expires_at")
      .single();

    if (inviteErr) {
      // Most common: RLS/permissions. Keep message but don’t leak sensitive internals.
      return json(403, { error: "invite_create_failed", message: inviteErr.message });
    }

    const baseUrl = getBaseUrl(request);
    const acceptUrl = `${baseUrl}/api/accept-invite?inviteId=${encodeURIComponent(
      invite.id
    )}&token=${encodeURIComponent(token)}`;

    const inviterName = inviterNameRaw || user.email || "A team member";

    // Send email (Resend) - only if API key is configured.
    let emailData = null;
    let emailSent = false;

    if (resend) {
      try {
        emailData = await resend.emails.send({
          from: "Gold.Arch <onboarding@resend.dev>",
          to: [to],
          replyTo: "goldarch.notifications@gmail.com",
          subject: "You're invited to join Gold.Arch",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 20px; background: #f9f9f9; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #f0f0f0; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #007AFF; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                .role-badge { display: inline-block; background: #E3F2FD; color: #1976D2; padding: 4px 12px; border-radius: 16px; font-weight: bold; }
                code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">You're Invited!</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9;">Join Gold.Arch Team</p>
                </div>
                <div class="content">
                  <p>Hello,</p>
                  <p><strong>${escapeHtml(inviterName)}</strong> has invited you to join their organization on Gold.Arch.</p>
                  <p>Your assigned role: <span class="role-badge">${roleDisplayName[role] || "Team Member"}</span></p>
                  <p style="text-align: center;">
                    <a href="${acceptUrl}" class="button">Accept Invitation</a>
                  </p>
                  <p style="font-size: 12px; color: #666;">
                    If the button doesn't work, copy/paste this link:<br/>
                    <code>${acceptUrl}</code>
                  </p>
                  <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                  <p>Gold.Arch Supplier Management System</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        emailSent = true;
      } catch (emailError) {
        console.error("Failed to send invite email:", emailError);
        // Continue without failing - invite record is already created
      }
    } else {
      console.warn("RESEND_API_KEY not configured - skipping email send (test mode)");
    }

    return json(200, {
      success: true,
      inviteId: invite.id,
      acceptUrl,
      emailSent,
      data: emailData
    });
  } catch (err) {
    console.error("send-invite error:", err);
    return json(500, { error: "Failed to send invite" });
  }
}
