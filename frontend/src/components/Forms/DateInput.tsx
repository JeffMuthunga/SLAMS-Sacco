"use client";

import flatpickr from "flatpickr";
import type { Instance } from "flatpickr/dist/types/instance";
import React, { useEffect, useRef } from "react";

interface DateInputProps {
    label?: string;
    id?: string;
    name?: string;
    value?: string;
    onChange?: (date: string) => void;
    placeholder?: string;
    /** When true, renders a date-only picker (no time selection). */
    disableTime?: boolean;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    minDate?: string;
    maxDate?: string;
    className?: string;
}

export default function DateInput({
    label = "",
    id = "",
    name = "",
    value = "",
    onChange = () => { },
    placeholder = "Select date",
    disableTime = true,
    error,
    required,
    disabled = false,
    minDate,
    maxDate,
    className = "",
}: DateInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const pickerRef = useRef<Instance | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        if (!inputRef.current) return;

        pickerRef.current = flatpickr(inputRef.current, {
            enableTime: !disableTime,
            dateFormat: disableTime ? "Y-m-d" : "Y-m-d H:i",
            minDate,
            maxDate,
            onChange: (_dates, dateStr) => onChangeRef.current(dateStr),
        });

        return () => {
            pickerRef.current?.destroy();
            pickerRef.current = null;
        };
    }, [disableTime, minDate, maxDate]);

    // Keep the picker in sync when the value prop changes externally
    useEffect(() => {
        if (!pickerRef.current) return;
        if (value) {
            pickerRef.current.setDate(value, false);
        } else {
            pickerRef.current.clear(false);
        }
    }, [value]);

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label
                    htmlFor={id || undefined}
                    className="mb-2 block text-sm font-medium text-gray-700"
                >
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                ref={inputRef}
                id={id || undefined}
                name={name || undefined}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    error
                        ? "border-red-600 focus:ring-red-600"
                        : "border-gray-300 hover:border-green-600 focus:ring-green-600"
                }`}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}
