// src/app/api/contact/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Missing Resend API key." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const formType = clean(body.formType);
    const name = clean(body.name);
    const business = clean(body.business);
    const email = clean(body.email);
    const website = clean(body.website);
    const inquiryType = clean(body.inquiryType);
    const location = clean(body.location);
    const suggestionType = clean(body.suggestionType);
    const message = clean(body.message);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const isSuggestion = formType === "suggestion";

    const subject = isSuggestion
      ? `New Tourism Suggestion: ${suggestionType || "General"}`
      : `New Featured Placement Inquiry: ${business || name}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2>${escapeHtml(subject)}</h2>

        <p><strong>Form Type:</strong> ${escapeHtml(formType || "business")}</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>

        ${
          business
            ? `<p><strong>Business:</strong> ${escapeHtml(business)}</p>`
            : ""
        }

        ${
          website
            ? `<p><strong>Website/Facebook:</strong> ${escapeHtml(website)}</p>`
            : ""
        }

        ${
          inquiryType
            ? `<p><strong>Inquiry Type:</strong> ${escapeHtml(inquiryType)}</p>`
            : ""
        }

        ${
          location
            ? `<p><strong>Town / Area:</strong> ${escapeHtml(location)}</p>`
            : ""
        }

        ${
          suggestionType
            ? `<p><strong>Suggestion Type:</strong> ${escapeHtml(
                suggestionType
              )}</p>`
            : ""
        }

        <hr />

        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: "Natural State Tourism Project <noreply@hometownwebservicesar.cc>",
      to: ["naturalstatetourismproject@gmail.com"],
      replyTo: email,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json(
        { error: "Email failed to send.", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong.", details: String(error) },
      { status: 500 }
    );
  }
}