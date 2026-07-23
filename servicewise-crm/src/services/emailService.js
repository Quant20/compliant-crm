import { supabase } from "./supabaseClient";

async function getFunctionErrorMessage(error) {
  let message =
    error?.message ||
    "Unable to send the email.";

  const response = error?.context;

  if (
    response &&
    typeof response.json === "function"
  ) {
    try {
      const responseBody =
        await response.json();

      message =
        responseBody?.error ||
        responseBody?.message ||
        message;
    } catch {
      // Keep the original Supabase error message.
    }
  }

  return message;
}

export async function sendTicketEmail({
  ticketId,
  ticketNumber,
  mode = "reply",
  to,
  cc = [],
  bcc = [],
  subject,
  bodyText,
  bodyHtml,
}) {
  const { data, error } =
    await supabase.functions.invoke(
      "send-ticket-email",
      {
        body: {
          ticketId,
          ticketNumber,
          mode,
          to,
          cc,
          bcc,
          subject,
          bodyText,
          bodyHtml,
        },
      },
    );

  if (error) {
    const message =
      await getFunctionErrorMessage(error);

    throw new Error(message);
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        "The email service did not confirm delivery.",
    );
  }

  return data;
}
