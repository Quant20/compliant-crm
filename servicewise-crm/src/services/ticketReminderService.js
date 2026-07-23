const TASK_STORAGE_KEY =
  "servicewise_ticket_tasks";

function readTasks() {
  try {
    const savedValue = localStorage.getItem(
      TASK_STORAGE_KEY,
    );

    const tasks = JSON.parse(savedValue || "[]");

    return Array.isArray(tasks) ? tasks : [];
  } catch (error) {
    console.error(
      "Unable to read ticket reminders:",
      error,
    );

    return [];
  }
}

function writeTasks(tasks) {
  try {
    localStorage.setItem(
      TASK_STORAGE_KEY,
      JSON.stringify(tasks),
    );
  } catch (error) {
    console.error(
      "Unable to update ticket reminders:",
      error,
    );
  }
}

function getTaskTimestamp(task) {
  if (!task?.dueDate || !task?.dueTime) {
    return Number.NaN;
  }

  return new Date(
    `${task.dueDate}T${task.dueTime}`,
  ).getTime();
}

export function checkTicketReminders(
  onReminder,
) {
  const tasks = readTasks();
  const now = Date.now();
  let changed = false;

  const updatedTasks = tasks.map((task) => {
    const dueAt = getTaskTimestamp(task);

    const shouldRemind =
      !task.completed &&
      !task.reminded &&
      Number.isFinite(dueAt) &&
      dueAt <= now;

    if (!shouldRemind) {
      return task;
    }

    changed = true;

    try {
      onReminder?.(task);
    } catch (error) {
      console.error(
        "Ticket reminder callback failed:",
        error,
      );
    }

    return {
      ...task,
      reminded: true,
      remindedAt: new Date().toISOString(),
    };
  });

  if (changed) {
    writeTasks(updatedTasks);
  }

  return updatedTasks;
}

export function startTicketReminderWatcher(
  onReminder,
  intervalMilliseconds = 30000,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  checkTicketReminders(onReminder);

  const intervalId = window.setInterval(
    () => checkTicketReminders(onReminder),
    Math.max(5000, intervalMilliseconds),
  );

  const handleStorage = (event) => {
    if (event.key === TASK_STORAGE_KEY) {
      checkTicketReminders(onReminder);
    }
  };

  window.addEventListener(
    "storage",
    handleStorage,
  );

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener(
      "storage",
      handleStorage,
    );
  };
}
