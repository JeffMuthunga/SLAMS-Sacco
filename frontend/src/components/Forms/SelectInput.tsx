import Select, { Props as SelectProps } from 'react-select';
import React from 'react';

interface SelectDropdownProps extends SelectProps {
    label?: string;
    options?: { value: string | any | number; label: string }[];
    defaultValue?: { value: string | number; label: string } | null;
    placeholder?: string;
    id?: string;
    isSearchable?: boolean;
    isClearable?: boolean;
    onChange?: (selectedOption: { value: string; label: string } | any | null) => void | any;
    disabled?: boolean;
    isMulti?: boolean;
    value?: { value: any; label: string } | any | null;
    error?: string;
    required?: boolean;
    name?: string;
    className?: string;
    usePortal?: boolean;
}

export default function SelectInput({
    label = '',
    id = '',
    options = [],
    defaultValue = null,
    placeholder = 'Select an option',
    isSearchable = true,
    onChange = () => { },
    name = '',
    isMulti = false,
    disabled = false,
    value = null,
    required,
    error,
    className = '',
    usePortal = false,
    ...rest
}: SelectDropdownProps) {
    const customStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderColor: error
                ? '#dc2626' // red-600
                : state.isFocused
                    ? '#16a34a' // green-600
                    : provided.borderColor,
            boxShadow: state.isFocused ? (error ? '0 0 0 2px #dc2626' : '0 0 0 2px #16a34a') : 'none',
            '&:hover': {
                borderColor: error ? '#dc2626' : '#16a34a',
            },
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#16a34a' : state.isFocused ? '#15803d' : provided.backgroundColor,
            color: state.isSelected || state.isFocused ? 'white' : provided.color,
            whiteSpace: 'nowrap',
        }),
        menu: (provided: any) => ({
            ...provided,
            backgroundColor: '#ffffff',
            zIndex: 9999,
        }),
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    };

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <Select
                {...(isMulti ? {} : { defaultValue })}
                options={options}
                isSearchable={isSearchable}
                isMulti={isMulti}
                id={id}
                name={name}
                onChange={onChange}
                isDisabled={disabled}
                styles={customStyles}
                required={required}
                classNamePrefix="react-select"
                placeholder={placeholder}
                value={value || defaultValue}
                menuPortalTarget={usePortal && typeof window !== 'undefined' ? document.body : undefined}
                menuPosition={usePortal ? "fixed" : "absolute"}
                {...rest}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}
