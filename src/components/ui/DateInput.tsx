"use client";

import React, { useState, useRef } from "react";
import { Calendar } from "lucide-react";

/**
 * Format any ISO string, YYYY-MM-DD, or Date into DD/MM/YYYY.
 * Uses string matching / UTC to completely prevent timezone off-by-one errors.
 */
export function formatToDDMMYYYY(val?: string | Date | null): string {
  if (!val) return "";
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    const d = String(val.getUTCDate()).padStart(2, "0");
    const m = String(val.getUTCMonth() + 1).padStart(2, "0");
    const y = val.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }
  const str = String(val).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${d}/${m}/${y}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const y = parsed.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }
  return "";
}

/**
 * Convert DD/MM/YYYY into YYYY-MM-DD for native HTML date input sync.
 */
export function ddMmYyyyToIso(ddmmyyyy?: string | null): string {
  if (!ddmmyyyy) return "";
  const match = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m}-${d}`;
  }
  return "";
}

/**
 * Validate DD/MM/YYYY calendar correctness.
 */
export function isValidDDMMYYYY(str: string): boolean {
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;

  // Verify days in month
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

interface DateInputProps {
  value?: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function DateInput({
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "DD/MM/YYYY",
}: DateInputProps) {
  const formattedVal = formatToDDMMYYYY(value);
  const [prevVal, setPrevVal] = useState(value);
  const [text, setText] = useState(formattedVal);
  const hiddenPickerRef = useRef<HTMLInputElement>(null);

  if (value !== prevVal) {
    setPrevVal(value);
    setText(formattedVal);
  }

  const handleBlur = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      if (value) onChange(null);
      return;
    }
    if (isValidDDMMYYYY(trimmed)) {
      if (trimmed !== formattedVal) {
        onChange(trimmed);
      }
    } else {
      // Revert if invalid
      setText(formattedVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pickedIso = e.target.value; // YYYY-MM-DD
    if (!pickedIso) {
      onChange(null);
      setText("");
      return;
    }
    const [y, m, d] = pickedIso.split("-");
    const ddmmyyyy = `${d}/${m}/${y}`;
    setText(ddmmyyyy);
    onChange(ddmmyyyy);
  };

  const openPicker = () => {
    if (disabled) return;
    try {
      hiddenPickerRef.current?.showPicker?.();
    } catch {
      hiddenPickerRef.current?.focus();
    }
  };

  const isoValue = ddMmYyyyToIso(text) || ddMmYyyyToIso(formattedVal);

  return (
    <div className={`relative inline-flex items-center w-full min-w-[125px] ${className}`}>
      <input
        type="text"
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={10}
        onChange={(e) => {
          let val = e.target.value;
          // Format auto-slash as user types numbers
          val = val.replace(/[^\d/]/g, "");
          setText(val);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full pl-2 pr-7 py-1 border border-[var(--color-border)] rounded text-xs text-[var(--color-foreground)] focus:border-blue-500 focus:outline-none bg-white font-mono disabled:bg-gray-100 disabled:text-gray-400"
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={openPicker}
        className="absolute right-1 text-gray-400 hover:text-blue-600 p-0.5 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title="Open calendar"
      >
        <Calendar className="w-3.5 h-3.5" />
      </button>
      {/* Hidden native date input for the picker dialog */}
      <input
        ref={hiddenPickerRef}
        type="date"
        tabIndex={-1}
        disabled={disabled}
        value={isoValue}
        onChange={handlePickerChange}
        className="sr-only"
        aria-hidden="true"
      />
    </div>
  );
}
