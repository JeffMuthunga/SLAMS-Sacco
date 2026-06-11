"use client";

import React from "react";

interface NumberInputProps {
    label?: string;
    id?: string;
    name?: string;
    value?: number | string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number | "any";
    className?: string;
}

export default function NumberInput({
    label = "",
    id = "",
    name = "",
    value,
    onChange = () => { },
    placeholder = "",
    error,
    required,
    disabled = false,
    min,
    max,
    step,
    className = "",
}: NumberInputProps) {
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
                type="number"
                id={id || undefined}
                name={name || undefined}
                value={value ?? ""}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                min={min}
                max={max}
                step={step}
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
