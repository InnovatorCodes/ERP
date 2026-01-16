// components/ui/fields.tsx
'use client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define the type for the options used in the toggle group
export type ToggleOption<T> = {
  label: string;
  value: T;
};

// Your ToggleGroupField component, which is correctly defined
export const ToggleGroupField = <T extends string | boolean>({ label, name, value, onValueChange, disabled, options }: { label: string; name: string; value: T | undefined; onValueChange: (value: T) => void; disabled: boolean; options: ToggleOption<T>[]}) => (
    <div>
        {/* Hidden input holds the name and value for the form submission */}
        <input type="hidden" name={name} value={String(value ?? '')} />
        <Label className="block text-sm font-medium text-gray-700 mb-1">{label}</Label>
        <div className="flex flex-wrap bg-gray-100 rounded-lg p-1">
            {options.map(option => (
                <button type="button" key={String(option.value)} onClick={() => !disabled && onValueChange(option.value)} disabled={disabled} className={`flex-1 text-sm text-center py-2 px-2 rounded-md transition-all duration-200 ${value === option.value ? 'bg-white shadow font-semibold text-gray-800' : 'bg-transparent text-gray-600 hover:bg-gray-200'} disabled:cursor-not-allowed`}>{option.label}</button>
            ))}
        </div>
    </div>
);

// --- CORRECTED INPUT FIELD COMPONENT ---
// This version is updated to accept value and onChange for controlled components.
export const InputField = ({ label, name, type = 'text', placeholder, value, onChange, step }: { 
    label: string; 
    name: string; 
    type?: string; 
    placeholder?: string; 
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    step?: string;
}) => (
    <div>
        <Label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</Label>
        <Input 
            type={type} 
            id={name} 
            name={name} 
            placeholder={placeholder} 
            value={value}
            onChange={onChange}
            step={step}
        />
    </div>
);
