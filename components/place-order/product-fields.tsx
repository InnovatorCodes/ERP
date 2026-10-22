'use client';
import React, { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils";
import { Product, ProductWithFiles } from "@/types/products";

// --- Detailed Forms ---
export interface DetailsFormProps<T extends Product | ProductWithFiles = Product> {
  baseName: string;
  index: number;
  product: T;
  handleProductChange: <K extends keyof T>(index: number, field: K, value: T[K] | null) => void;
  disabled: boolean;
  nameError?: string;
}

const FieldLabel = ({ label, required }: { label: string; required?: boolean }) => (
    <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
);

export const InputField = ({ label, name, value, error, required, hideLabel, className, ...props }: { label: string; name: string; isCustomized?: boolean, error?: string, required?: boolean; hideLabel?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        {!hideLabel && <FieldLabel label={label} required={required} />}
        <Input
            name={name}
            value={value}
            required={required}
            aria-invalid={!!error}
            aria-label={hideLabel ? label : undefined}
            className={cn("bg-card", className)}
            {...props}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
);

export type ToggleOption<T extends string | boolean> = {
    value: T;
    label: string;
};

export const ToggleGroupField = <T extends string | boolean>({ label, name, value, onValueChange, disabled, options, required, hideLabel }: { label: string; name: string; value: T | undefined | null; onValueChange: (value: T | null) => void; disabled: boolean; options: ToggleOption<T>[], required?: boolean; hideLabel?: boolean}) => (
    <div>
        {/* Hidden input holds the name and value for the form submission */}
        <input type="hidden" name={name} value={String(value ?? '')} />
        {!hideLabel && <FieldLabel label={label} required={required} />}
        <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-1 rounded-lg border bg-muted p-1", disabled && "opacity-60")}>
            {options.map(option => {
                const selected = value === option.value;
                return (
                    <button
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        key={String(option.value)}
                        onClick={() => {
                            if (disabled) return;
                            onValueChange(option.value);
                        }}
                        disabled={disabled}
                        className={cn(
                            "flex flex-1 items-center justify-center self-stretch rounded-md px-2 py-1.5 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
                            selected ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    </div>
);

export const ComboboxField = ({ label, name, value, onValueChange, disabled, options, placeholder, required, hideLabel }: { label: string; name: string; value: string | undefined | null; onValueChange: (value: string | null) => void; disabled: boolean; options: {value: string, label: string}[]; placeholder: string, required?: boolean; hideLabel?: boolean }) => {
    const [open, setOpen] = useState(false);
    return (
        <div>
            {/* Hidden input holds the name and value for the form submission */}
            <input type="hidden" name={name} value={value ?? ''} />
            {!hideLabel && <FieldLabel label={label} required={required} />}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-label={label}
                        className={cn("w-full justify-between bg-card font-normal", !value && "text-muted-foreground")}
                        disabled={disabled}
                    >
                        {value ? options.find((option) => option.value === value)?.label : placeholder}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Search..." />
                        <CommandList>
                            <CommandEmpty>No option found.</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => {
                                            onValueChange(value === option.value ? null : option.value);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check className={cn("mr-2 size-4", value === option.value ? "opacity-100" : "opacity-0")} />
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export const TextAreaField = ({ label, name, required, hideLabel, className, ...props }: { label: string; name: string, required?: boolean; hideLabel?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <div className="md:col-span-3">
        {!hideLabel && <FieldLabel label={label} required={required} />}
        <Textarea name={name} required={required} aria-label={hideLabel ? label : undefined} className={cn("bg-card", className)} {...props} />
    </div>
);
