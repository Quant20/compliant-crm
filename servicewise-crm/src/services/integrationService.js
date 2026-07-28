const API_BASE_URL =
  import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    },
  );

  const data = await response.json().catch(
    () => ({}),
  );

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ||
        data?.error ||
        "The integration request failed.",
    );
  }

  return data.data;
}

export function scheduleGoogleMeeting(payload) {
  return request(
    "/api/integrations/calendar/meetings",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function generateAiDraft(payload) {
  return request(
    "/api/integrations/ai/draft",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
