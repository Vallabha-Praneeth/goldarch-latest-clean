import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const roleDisplayName = {
  owner: 'Owner',
  admin: 'Administrator',
  manager: 'Manager',
  procurement: 'Procurement Specialist',
  viewer: 'Viewer',
};

export async function POST(request) {
  try {
    const { to, inviterName, role, inviteLink } = await request.json();

    if (!to) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: "Gold.Arch <onboarding@resend.dev>",
      to: [to],
      replyTo: "goldarch.notifications@gmail.com",
      subject: `You're invited to join Gold.Arch`,
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
              <p><strong>${inviterName || 'A team member'}</strong> has invited you to join their organization on Gold.Arch, the construction supplier management platform.</p>
              <p>Your assigned role: <span class="role-badge">${roleDisplayName[role] || 'Team Member'}</span></p>
              <p>With Gold.Arch, you'll be able to:</p>
              <ul>
                <li>Manage supplier relationships</li>
                <li>Track deals and projects</li>
                <li>Handle quotes and inventory</li>
                <li>Collaborate with your team</li>
              </ul>
              ${inviteLink ? `
              <p style="text-align: center;">
                <a href="${inviteLink}" class="button">Accept Invitation</a>
              </p>
              ` : `
              <p><strong>Get started:</strong></p>
              <ul>
                <li>Web: <a href="https://goldarch-web.vercel.app">goldarch-web.vercel.app</a></li>
                <li>Mobile: Download from App Store / Play Store</li>
              </ul>
              `}
              <p>If you have any questions, simply reply to this email.</p>
            </div>
            <div class="footer">
              <p>Gold.Arch Supplier Management System</p>
              <p style="font-size: 11px;">If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
