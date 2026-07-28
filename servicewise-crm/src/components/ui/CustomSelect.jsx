import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./CustomSelect.css";

export default function CustomSelect({
  id,
  value,
  options = [],
  onChange,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const normalizedOptions = useMemo(() => {
    return options.map((option) => {
      if (typeof option === "string") {
        return {
          value: option,
          label: option,
        };
      }

      return option;
    });
  }, [options]);

  const selectedOption =
    normalizedOptions.find(
      (option) =>
        String(option.value) === String(value),
    ) || normalizedOptions[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target,
        )
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

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

  const selectOption = (option) => {
    onChange?.(option.value);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="sw-custom-select"
    >
      <button
        id={id}
        type="button"
        className={`sw-custom-select__trigger ${
          isOpen ? "is-open" : ""
        }`}
        onClick={() =>
          setIsOpen((current) => !current)
        }
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className="sw-custom-select__value">
          {selectedOption?.label || value}
        </span>

        <span
          className="sw-custom-select__arrow"
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="sw-custom-select__menu"
          role="listbox"
          aria-labelledby={id}
        >
          {normalizedOptions.map((option) => {
            const isSelected =
              String(option.value) ===
              String(value);

            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`sw-custom-select__option ${
                  isSelected
                    ? "is-selected"
                    : ""
                }`}
                onClick={() =>
                  selectOption(option)
                }
              >
                <span>{option.label}</span>

                {isSelected && (
                  <span
                    className="sw-custom-select__check"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
