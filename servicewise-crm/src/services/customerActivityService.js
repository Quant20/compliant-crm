const CUSTOMER_ACTIVITY_STORAGE_KEY =
  "servicewise_customer_activities";

function cleanValue(value) {
  return String(value ?? "").trim();
}

function getStorage() {
  if (
    typeof window === "undefined" ||
    !window.localStorage
  ) {
    return null;
  }

  return window.localStorage;
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `activity-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function safelyParse(value) {
  try {
    const parsedValue = JSON.parse(value);

    return Array.isArray(parsedValue)
      ? parsedValue
      : [];
  } catch {
    return [];
  }
}

export function getCustomerActivities() {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  return safelyParse(
    storage.getItem(
      CUSTOMER_ACTIVITY_STORAGE_KEY,
    ),
  );
}

export function saveCustomerActivities(
  activities,
) {
  const storage = getStorage();

  const safeActivities = Array.isArray(
    activities,
  )
    ? activities
    : [];

  if (storage) {
    storage.setItem(
      CUSTOMER_ACTIVITY_STORAGE_KEY,
      JSON.stringify(safeActivities),
    );
  }

  return safeActivities;
}

export function getActivitiesByCustomerId(
  customerId,
) {
  return getCustomerActivities()
    .filter(
      (activity) =>
        String(activity.customerId) ===
        String(customerId),
    )
    .sort(
      (firstActivity, secondActivity) =>
        new Date(secondActivity.createdAt)
          .getTime() -
        new Date(firstActivity.createdAt)
          .getTime(),
    );
}

export function createCustomerActivity(
  customerId,
  activityData = {},
) {
  if (!customerId) {
    throw new Error(
      "A customer is required before recording an interaction.",
    );
  }

  const activityType =
    cleanValue(activityData.type) ||
    "note";

  const details = cleanValue(
    activityData.details,
  );

  if (!details) {
    throw new Error(
      "Interaction details are required.",
    );
  }

  const now = new Date().toISOString();

  const newActivity = {
    id: createId(),

    customerId: String(customerId),

    type: activityType,

    direction:
      cleanValue(activityData.direction) ||
      "Internal",

    title:
      cleanValue(activityData.title) ||
      `${activityType} interaction`,

    details,

    outcome: cleanValue(
      activityData.outcome,
    ),

    channel:
      cleanValue(activityData.channel) ||
      activityType,

    agent:
      cleanValue(activityData.agent) ||
      "Support Agent",

    duration: cleanValue(
      activityData.duration,
    ),

    createdAt:
      activityData.createdAt || now,

    updatedAt: now,
  };

  const activities =
    getCustomerActivities();

  saveCustomerActivities([
    newActivity,
    ...activities,
  ]);

  return newActivity;
}

export function deleteCustomerActivity(
  activityId,
) {
  const remainingActivities =
    getCustomerActivities().filter(
      (activity) =>
        String(activity.id) !==
        String(activityId),
    );

  saveCustomerActivities(
    remainingActivities,
  );

  return remainingActivities;
}

export function clearCustomerActivities() {
  const storage = getStorage();

  if (storage) {
    storage.removeItem(
      CUSTOMER_ACTIVITY_STORAGE_KEY,
    );
  }
}

export {
  CUSTOMER_ACTIVITY_STORAGE_KEY,
};
