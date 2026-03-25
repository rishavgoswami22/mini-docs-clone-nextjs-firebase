import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY not configured — sharing works but no email sent" },
        { status: 200 }
      );
    }

    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const body = await req.json();
    const { to, docTitle, docUrl, inviterEmail } = body as {
      to: string;
      docTitle: string;
      docUrl: string;
      inviterEmail: string;
    };

    if (!to || !docUrl) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const title = docTitle || "Untitled";

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Mini Docs <onboarding@resend.dev>",
      to: [to],
      subject: `${inviterEmail} shared "${title}" with you`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 0">
          <h2 style="margin:0 0 8px">${inviterEmail} invited you to edit a document</h2>
          <p style="color:#666;margin:0 0 24px">
            You've been added as an editor on <strong>${title}</strong>.
          </p>
          <a
            href="${docUrl}"
            style="display:inline-block;background:#171717;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600"
          >
            Open document
          </a>
          <p style="color:#999;font-size:13px;margin-top:32px">
            If you don't have an account yet, sign up with this email address (<strong>${to}</strong>) to see it.
          </p>
        </div>
      `,
    });

    if (error) {
      console.warn("Resend couldn't deliver:", error.message);
      return NextResponse.json({
        ok: false,
        emailSent: false,
        reason: error.message,
      });
    }

    return NextResponse.json({ ok: true, emailSent: true });
  } catch (err) {
    console.error("Invite API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
