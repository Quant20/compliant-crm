const REMOVED_AGENT_NAME = "usman ali";
const OLD_AGENT_EMAIL =
  "usman.ali@servicewise.com";

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getRecordName(record) {
  return normalize(
    record?.name ||
      record?.fullName ||
      [
        record?.firstName,
        record?.lastName,
      ]
        .filter(Boolean)
        .join(" "),
  );
}

function isRemovedAgentRecord(record) {
  if (
    !record ||
    typeof record !== "object" ||
    Array.isArray(record)
  ) {
    return false;
  }

  const recordName = getRecordName(record);

  const looksLikeAgent =
    Boolean(
      record.role ||
        record.designation ||
        record.employeeId ||
        record.employee_id ||
        record.accountStatus ||
        record.account_status ||
        record.isAssignable !== undefined,
    );

  return (
    looksLikeAgent &&
    recordName === REMOVED_AGENT_NAME
  );
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item) =>
          !isRemovedAgentRecord(item),
      )
      .map(sanitizeValue)
      .filter((item) => item !== null);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const cleanedObject = {};

    Object.entries(value).forEach(
      ([key, currentValue]) => {
        if (
          typeof currentValue === "string"
        ) {
          const normalizedValue =
            normalize(currentValue);

          if (
            normalizedValue ===
            REMOVED_AGENT_NAME
          ) {
            cleanedObject[key] =
              "Unassigned";
            return;
          }

          if (
            normalizedValue ===
            OLD_AGENT_EMAIL
          ) {
            cleanedObject[key] =
              getRecordName(value) ===
              "qosain"
                ? "qosain@servicewise.com"
                : "";
            return;
          }
        }

        cleanedObject[key] =
          sanitizeValue(currentValue);
      },
    );

    return cleanedObject;
  }

  if (
    typeof value === "string" &&
    normalize(value) ===
      REMOVED_AGENT_NAME
  ) {
    return "Unassigned";
  }

  return value;
}

function cleanBrowserStorage() {
  try {
    const storageKeys = [];

    for (
      let index = 0;
      index < window.localStorage.length;
      index += 1
    ) {
      const key =
        window.localStorage.key(index);

      if (key) {
        storageKeys.push(key);
      }
    }

    storageKeys.forEach((key) => {
      const storedValue =
        window.localStorage.getItem(key);

      if (!storedValue) {
        return;
      }

      try {
        const parsedValue =
          JSON.parse(storedValue);

        const cleanedValue =
          sanitizeValue(parsedValue);

        const nextStoredValue =
          JSON.stringify(cleanedValue);

        if (
          nextStoredValue !== storedValue
        ) {
          window.localStorage.setItem(
            key,
            nextStoredValue,
          );
        }
      } catch {
        let cleanedValue = storedValue;

        cleanedValue =
          cleanedValue.replaceAll(
            "Usman Ali",
            "Unassigned",
          );

        cleanedValue =
          cleanedValue.replaceAll(
            OLD_AGENT_EMAIL,
            "qosain@servicewise.com",
          );

        if (
          cleanedValue !== storedValue
        ) {
          window.localStorage.setItem(
            key,
            cleanedValue,
          );
        }
      }
    });
  } catch (error) {
    console.error(
      "Unable to clean legacy CRM data:",
      error,
    );
  }
}

cleanBrowserStorage();
