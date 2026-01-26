import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const getTypeEmoji = (type) => {
  switch (type) {
    case 'deal': return '💼';
    case 'project': return '🏗️';
    case 'task': return '✅';
    case 'inventory': return '📦';
    case 'quote': return '📄';
    default: return '🔔';
  }
};

export async function POST(request) {
  try {
    const { to, subject, message, type } = await request.json();

    if (!to || !subject) {
      return NextResponse.json({ error: "Recipient and subject are required" }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: "Gold.Arch <onboarding@resend.dev>",
      to: [to],
      replyTo: "goldarch.notifications@gmail.com",
      subject: `${getTypeEmoji(type)} ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background: #f9f9f9; }
            .message { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e0e0e0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #f0f0f0; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${getTypeEmoji(type)} Gold.Arch Notification</h1>
            </div>
            <div class="content">
              <h2 style="color: #007AFF;">${subject}</h2>
              <div class="message">
                <p>${message || 'You have a new notification from Gold.Arch.'}</p>
              </div>
              <p>Log in to Gold.Arch to view more details.</p>
            </div>
            <div class="footer">
              <p>Gold.Arch Supplier Management System</p>
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
