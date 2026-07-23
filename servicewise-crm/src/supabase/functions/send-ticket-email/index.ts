import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json; charset=utf-8",
      },
    },
  );
}

function normalizeRecipients(
  value: unknown,
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeEditorHtml(value: unknown) {
  return String(value || "")
    .replace(
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      "",
    )
    .replace(
      /<style[\s\S]*?>[\s\S]*?<\/style>/gi,
      "",
    )
    .replace(
      /\son\w+\s*=\s*(["']).*?\1/gi,
      "",
    )
    .replace(
      /\son\w+\s*=\s*[^\s>]+/gi,
      "",
    )
    .replace(/javascript:/gi, "");
}

function buildEmailHtml({
  bodyHtml,
  bodyText,
  ticketNumber,
}: {
  bodyHtml: string;
  bodyText: string;
  ticketNumber: string;
}) {
  const safeBody =
    sanitizeEditorHtml(bodyHtml) ||
    escapeHtml(bodyText).replace(
      /\n/g,
      "<br />",
    );

  const safeTicketNumber =
    escapeHtml(ticketNumber);

  return `
    <div style="
      margin:0;
      padding:0;
      color:#1f2937;
      font-family:Arial,Helvetica,sans-serif;
      font-size:14px;
      line-height:1.65;
    ">
      <div>${safeBody}</div>

      ${
        safeTicketNumber
          ? `
            <div style="
              margin-top:24px;
              padding-top:14px;
              border-top:1px solid #e5e7eb;
              color:#64748b;
              font-size:12px;
            ">
              Reference: ${safeTicketNumber}
            </div>
          `
          : ""
      }
    </div>
  `;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, {
      success: false,
      error: "Method not allowed.",
    });
  }

  const resendApiKey =
    Deno.env.get("RESEND_API_KEY");

  const emailFrom =
    Deno.env.get("EMAIL_FROM");

  const replyTo =
    Deno.env.get("EMAIL_REPLY_TO");

  if (!resendApiKey) {
    return jsonResponse(500, {
      success: false,
      error:
        "RESEND_API_KEY is not configured.",
    });
  }

  if (!emailFrom) {
    return jsonResponse(500, {
      success: false,
      error:
        "EMAIL_FROM is not configured.",
    });
  }

  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, {
      success: false,
      error: "Invalid JSON request.",
    });
  }

  const to = normalizeRecipients(
    payload.to,
  );

  const cc = normalizeRecipients(
    payload.cc,
  );

  const bcc = normalizeRecipients(
    payload.bcc,
  );

  const subject = String(
    payload.subject || "",
  ).trim();

  const bodyText = String(
    payload.bodyText || "",
  ).trim();

  const bodyHtml = String(
    payload.bodyHtml || "",
  ).trim();

  const ticketId = String(
    payload.ticketId || "",
  ).trim();

  const ticketNumber = String(
    payload.ticketNumber || "",
  ).trim();

  const invalidAddress = [
    ...to,
    ...cc,
    ...bcc,
  ].find(
    (address) => !isEmailAddress(address),
  );

  if (to.length === 0) {
    return jsonResponse(400, {
      success: false,
      error:
        "At least one recipient is required.",
    });
  }

  if (invalidAddress) {
    return jsonResponse(400, {
      success: false,
      error: `Invalid email address: ${invalidAddress}`,
    });
  }

  if (!subject) {
    return jsonResponse(400, {
      success: false,
      error: "Email subject is required.",
    });
  }

  if (!bodyText) {
    return jsonResponse(400, {
      success: false,
      error: "Email message is required.",
    });
  }

  const resendPayload: Record<
    string,
    unknown
  > = {
    from: emailFrom,
    to,
    subject,
    text: bodyText,
    html: buildEmailHtml({
      bodyHtml,
      bodyText,
      ticketNumber,
    }),
  };

  if (cc.length > 0) {
    resendPayload.cc = cc;
  }

  if (bcc.length > 0) {
    resendPayload.bcc = bcc;
  }

  if (replyTo) {
    resendPayload.reply_to = replyTo;
  }

  if (ticketNumber || ticketId) {
    resendPayload.headers = {
      "X-ServiceWise-Ticket":
        ticketNumber || ticketId,
    };
  }

  const resendResponse = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${resendApiKey}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        resendPayload,
      ),
    },
  );

  const resendResult =
    await resendResponse.json();

  if (!resendResponse.ok) {
    console.error(
      "Resend email error:",
      resendResult,
    );

    return jsonResponse(
      resendResponse.status,
      {
        success: false,
        error:
          resendResult?.message ||
          "The email provider rejected the message.",
      },
    );
  }

  return jsonResponse(200, {
    success: true,
    emailId:
      resendResult?.id || null,
    ticketId:
      ticketId || null,
    ticketNumber:
      ticketNumber || null,
  });
});
