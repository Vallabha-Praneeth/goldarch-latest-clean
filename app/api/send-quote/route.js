import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { to, supplierName, quoteDetails, quoteNumber, total } = await request.json();

    if (!to) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: "Gold.Arch <onboarding@resend.dev>",
      to: [to],
      replyTo: "goldarch.notifications@gmail.com",
      subject: quoteNumber
        ? `Quotation #${quoteNumber} from Gold.Arch`
        : "Quotation from Gold.Arch",
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
            .quote-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border: 1px solid #e0e0e0; }
            .total { font-size: 18px; font-weight: bold; color: #007AFF; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Gold.Arch</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Construction Supplier Management</p>
            </div>
            <div class="content">
              <p>Hello ${supplierName || "there"},</p>
              <p>Please find the quotation details from <strong>Gold.Arch</strong>.</p>
              ${quoteDetails ? `
              <div class="quote-details">
                <h3 style="margin-top: 0;">Quote Details</h3>
                <pre style="white-space: pre-wrap; font-family: inherit;">${quoteDetails}</pre>
              </div>
              ` : ''}
              ${total ? `<p class="total">Total: $${total}</p>` : ''}
              <p>You can reply directly to this email if you have any questions.</p>
              <p>Best regards,<br/><strong>Gold.Arch Team</strong></p>
            </div>
            <div class="footer">
              <p>This email was sent from Gold.Arch Supplier Management System</p>
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
