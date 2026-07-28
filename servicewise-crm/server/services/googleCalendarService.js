import { google } from "googleapis";
import crypto from "node:crypto";

function getRequiredEnvironmentValue(name) {
  const value = process.env[name];

  if (!value) {
    const error = new Error(`${name} is not configured.`);
    error.statusCode = 503;
    throw error;
  }

  return value;
}

function getCalendarClient() {
  const clientId = getRequiredEnvironmentValue(
    "GMAIL_CLIENT_ID",
  );

  const clientSecret = getRequiredEnvironmentValue(
    "GMAIL_CLIENT_SECRET",
  );

  const refreshToken = getRequiredEnvironmentValue(
    "GMAIL_REFRESH_TOKEN",
  );

  const oauthClient = new google.auth.OAuth2(
    clientId,
    clientSecret,
  );

  oauthClient.setCredentials({
    refresh_token: refreshToken,
  });

  return google.calendar({
    version: "v3",
    auth: oauthClient,
  });
}

function normalizeAttendees(attendees) {
  const values = Array.isArray(attendees)
    ? attendees
    : String(attendees || "").split(/[,\n;]/);

  return [
    ...new Set(
      values
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean),
    ),
  ].map((email) => ({ email }));
}

export async function createCalendarMeeting({
  title,
  date,
  startTime,
  endTime,
  attendees,
  description = "",
  ticketNumber = "",
  timeZone = "Asia/Karachi",
  createGoogleMeet = true,
}) {
  if (!title || !date || !startTime || !endTime) {
    const error = new Error(
      "Title, date, start time and end time are required.",
    );

    error.statusCode = 400;
    throw error;
  }

  const calendar = getCalendarClient();

  const eventBody = {
    summary: title,
    description: [
      ticketNumber
        ? `ServiceWise ticket: ${ticketNumber}`
        : "",
      description,
    ]
      .filter(Boolean)
      .join("\n\n"),

    start: {
      dateTime: `${date}T${startTime}:00`,
      timeZone,
    },

    end: {
      dateTime: `${date}T${endTime}:00`,
      timeZone,
    },

    attendees: normalizeAttendees(attendees),

    reminders: {
      useDefault: false,
      overrides: [
        {
          method: "email",
          minutes: 60,
        },
        {
          method: "popup",
          minutes: 10,
        },
      ],
    },
  };

  if (createGoogleMeet) {
    eventBody.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    };
  }

  const response = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: "all",
    conferenceDataVersion: createGoogleMeet
      ? 1
      : 0,
    requestBody: eventBody,
  });

  const event = response.data;

  const meetLink =
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === "video",
    )?.uri ||
    "";

  return {
    id: event.id,
    title: event.summary,
    status: event.status,
    htmlLink: event.htmlLink,
    meetLink,
    start: event.start,
    end: event.end,
    attendees: event.attendees || [],
    createdAt: event.created,
  };
}
