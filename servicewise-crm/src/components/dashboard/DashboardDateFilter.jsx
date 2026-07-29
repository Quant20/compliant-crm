import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FaCalendarAlt,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

const WEEK_DAYS = [
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
];

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addMonths(value, amount) {
  return new Date(
    value.getFullYear(),
    value.getMonth() + amount,
    1,
  );
}

function startOfMonth(value) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    1,
  );
}

function endOfMonth(value) {
  return new Date(
    value.getFullYear(),
    value.getMonth() + 1,
    0,
  );
}

function isSameDay(first, second) {
  if (!first || !second) {
    return false;
  }

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function isBeforeDay(first, second) {
  return startOfDay(first).getTime() <
    startOfDay(second).getTime();
}

function isAfterDay(first, second) {
  return startOfDay(first).getTime() >
    startOfDay(second).getTime();
}

function isWithinRange(date, start, end) {
  if (!date || !start || !end) {
    return false;
  }

  const time = startOfDay(date).getTime();

  return (
    time >= startOfDay(start).getTime() &&
    time <= startOfDay(end).getTime()
  );
}

function parseDateInput(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function toInputDate(value) {
  if (!value) {
    return "";
  }

  const year = value.getFullYear();
  const month = String(
    value.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    value.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function formatMonthTitle(value) {
  return new Intl.DateTimeFormat("en-PK", {
    month: "short",
    year: "numeric",
  }).format(value);
}

function buildCalendarDays(monthDate) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const firstVisible = new Date(monthStart);

  firstVisible.setDate(
    firstVisible.getDate() - monthStart.getDay(),
  );

  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(firstVisible);

    date.setDate(
      firstVisible.getDate() + index,
    );

    days.push({
      date,
      outside:
        date.getMonth() !== monthDate.getMonth(),
      afterToday: isAfterDay(date, new Date()),
    });
  }

  while (
    days.length > 35 &&
    days
      .slice(-7)
      .every((item) => item.outside)
  ) {
    days.splice(-7);
  }

  return days;
}

function CalendarMonth({
  month,
  rangeStart,
  rangeEnd,
  onSelectDate,
}) {
  const days = useMemo(
    () => buildCalendarDays(month),
    [month],
  );

  return (
    <div className="sw-range-calendar-month">
      <div className="sw-range-calendar-month-title">
        {formatMonthTitle(month)}
      </div>

      <div className="sw-range-calendar-weekdays">
        {WEEK_DAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="sw-range-calendar-days">
        {days.map(({ date, outside, afterToday }) => {
          const selectedStart =
            isSameDay(date, rangeStart);

          const selectedEnd =
            isSameDay(date, rangeEnd);

          const inRange =
            isWithinRange(
              date,
              rangeStart,
              rangeEnd,
            );

          const classNames = [
            "sw-range-calendar-day",
            outside
              ? "sw-range-calendar-day--outside"
              : "",
            inRange
              ? "sw-range-calendar-day--in-range"
              : "",
            selectedStart
              ? "sw-range-calendar-day--start"
              : "",
            selectedEnd
              ? "sw-range-calendar-day--end"
              : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              type="button"
              key={toInputDate(date)}
              className={classNames}
              disabled={afterToday}
              onClick={() => onSelectDate(date)}
              aria-label={formatDisplayDate(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardDateFilter({
  rangeType,
  onRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  rangeLabel,
}) {
  const wrapperRef = useRef(null);

  const initialStart =
    parseDateInput(customStart);

  const initialEnd =
    parseDateInput(customEnd);

  const [calendarOpen, setCalendarOpen] =
    useState(false);

  const [visibleMonth, setVisibleMonth] =
    useState(
      startOfMonth(
        initialStart || new Date(),
      ),
    );

  const [draftStart, setDraftStart] =
    useState(initialStart);

  const [draftEnd, setDraftEnd] =
    useState(initialEnd);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setCalendarOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setCalendarOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  useEffect(() => {
    if (rangeType !== "custom") {
      setCalendarOpen(false);
    }
  }, [rangeType]);

  function handleRangeChange(event) {
    const value = event.target.value;

    onRangeChange(value);

    if (value === "custom") {
      const selectedStart =
        parseDateInput(customStart);

      const selectedEnd =
        parseDateInput(customEnd);

      setDraftStart(selectedStart);
      setDraftEnd(selectedEnd);

      setVisibleMonth(
        startOfMonth(
          selectedStart || new Date(),
        ),
      );

      setCalendarOpen(true);
    }
  }

  function handleSelectDate(date) {
    if (
      !draftStart ||
      draftEnd ||
      isBeforeDay(date, draftStart)
    ) {
      setDraftStart(date);
      setDraftEnd(null);
      return;
    }

    setDraftEnd(date);
  }

  function handleCancel() {
    setDraftStart(
      parseDateInput(customStart),
    );

    setDraftEnd(
      parseDateInput(customEnd),
    );

    setCalendarOpen(false);
  }

  function handleApply() {
    if (!draftStart || !draftEnd) {
      return;
    }

    onCustomStartChange(
      toInputDate(draftStart),
    );

    onCustomEndChange(
      toInputDate(draftEnd),
    );

    onRangeChange("custom");
    setCalendarOpen(false);
  }

  const appliedCustomRange =
    customStart && customEnd
      ? `${formatDisplayDate(
          parseDateInput(customStart),
        )} – ${formatDisplayDate(
          parseDateInput(customEnd),
        )}`
      : "";

  return (
    <section className="sw-dashboard-date-filter">
      <div className="sw-dashboard-date-filter__heading">
        <span className="sw-dashboard-date-filter__icon">
          <FaCalendarAlt />
        </span>

        <div className="sw-dashboard-date-filter__copy">
          <strong>Dashboard Overview</strong>

          <span>
            {rangeType === "custom" &&
            appliedCustomRange
              ? appliedCustomRange
              : rangeLabel}
          </span>
        </div>
      </div>

      <div
        className="sw-dashboard-date-filter__controls"
        ref={wrapperRef}
      >
        <div className="sw-dashboard-range-select-wrapper">
          <FaCalendarAlt className="sw-dashboard-range-select-icon" />

          <select
            className="sw-dashboard-range-select"
            value={rangeType}
            onChange={handleRangeChange}
            aria-label="Select dashboard date range"
          >
            {RANGE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <FaChevronDown className="sw-dashboard-range-select-arrow" />
        </div>

        {rangeType === "custom" && (
          <button
            type="button"
            className="sw-dashboard-open-calendar"
            onClick={() =>
              setCalendarOpen((current) => !current)
            }
          >
            <span>
              {appliedCustomRange ||
                "Select date range"}
            </span>

            <FaCalendarAlt />
          </button>
        )}

        {rangeType === "custom" &&
          calendarOpen && (
            <div className="sw-range-calendar-popover">
              <div className="sw-range-calendar-header">
                <button
                  type="button"
                  className="sw-range-calendar-nav"
                  onClick={() =>
                    setVisibleMonth((current) =>
                      addMonths(current, -1),
                    )
                  }
                  aria-label="Previous month"
                >
                  <FaChevronLeft />
                </button>

                <span>Select date range</span>

                <button
                  type="button"
                  className="sw-range-calendar-nav"
                  onClick={() =>
                    setVisibleMonth((current) =>
                      addMonths(current, 1),
                    )
                  }
                  disabled={
                    addMonths(
                      visibleMonth,
                      1,
                    ) >
                    startOfMonth(new Date())
                  }
                  aria-label="Next month"
                >
                  <FaChevronRight />
                </button>
              </div>

              <div className="sw-range-calendar-grid">
                <CalendarMonth
                  month={visibleMonth}
                  rangeStart={draftStart}
                  rangeEnd={draftEnd}
                  onSelectDate={handleSelectDate}
                />

                <CalendarMonth
                  month={addMonths(
                    visibleMonth,
                    1,
                  )}
                  rangeStart={draftStart}
                  rangeEnd={draftEnd}
                  onSelectDate={handleSelectDate}
                />
              </div>

              <div className="sw-range-calendar-footer">
                <span className="sw-range-calendar-selection">
                  {draftStart
                    ? formatDisplayDate(
                        draftStart,
                      )
                    : "Start date"}

                  {" – "}

                  {draftEnd
                    ? formatDisplayDate(
                        draftEnd,
                      )
                    : "End date"}
                </span>

                <div className="sw-range-calendar-actions">
                  <button
                    type="button"
                    className="sw-range-calendar-cancel"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="sw-range-calendar-apply"
                    onClick={handleApply}
                    disabled={
                      !draftStart || !draftEnd
                    }
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </section>
  );
}
