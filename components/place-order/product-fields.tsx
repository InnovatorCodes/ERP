'use client';
import React, { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Textarea } from "@/components/ui/textarea"; // Assuming path is correct
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, UploadCloud, X} from 'lucide-react'
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

export const InputField = ({ label, name, value, error, required, hideLabel, ...props }: { label: string; name: string; isCustomized?: boolean, error?: string, required?: boolean; hideLabel?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        {!hideLabel && (
            <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500">*</span>}</label>
            </div>
        )}
        <input name={name} value={value} required={required} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500 disabled:bg-gray-200 disabled:cursor-not-allowed" />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

export type ToggleOption<T extends string | boolean> = {
    value: T;
    label: string;
};

export const ToggleGroupField = <T extends string | boolean>({ label, name, value, onValueChange, disabled, options, required, hideLabel }: { label: string; name: string; value: T | undefined | null; onValueChange: (value: T | null) => void; disabled: boolean; options: ToggleOption<T>[], required?: boolean; hideLabel?: boolean}) => (
    <div>
        {/* Hidden input holds the name and value for the form submission */}
        <input type="hidden" name={name} value={String(value ?? '')} required={required} />
        {!hideLabel && (
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
        )}
        <div className="flex items-center flex-wrap gap-2 bg-gray-100 rounded-lg p-1">
            {options.map(option => (
                <button 
                    type="button" 
                    key={String(option.value)} 
                    onClick={() => {
                        if (disabled) return;
                        onValueChange(option.value);
                    }} 
                    disabled={disabled} 
                    className={`flex flex-1 self-stretch justify-center items-center text-sm text-center py-2 px-2 rounded-md transition-all duration-200 ${value === option.value ? 'bg-white shadow font-semibold text-gray-800' : 'bg-transparent text-gray-600 hover:bg-gray-200'} disabled:cursor-not-allowed`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    </div>
);

export const ComboboxField = ({ label, name, value, onValueChange, disabled, options, placeholder, required, hideLabel }: { label: string; name: string; value: string | undefined | null; onValueChange: (value: string | null) => void; disabled: boolean; options: {value: string, label: string}[]; placeholder: string, required?: boolean; hideLabel?: boolean }) => {
    const [open, setOpen] = useState(false);
    return (
        <div>
            {/* Hidden input holds the name and value for the form submission */}
            <input type="hidden" name={name} value={value ?? ''} required={required} />
            {!hideLabel && (
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed" disabled={disabled}>
                        {value ? options.find((option) => option.value === value)?.label : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search..." /><CommandList><CommandEmpty>No option found.</CommandEmpty><CommandGroup>
                    {options.map((option) => (<CommandItem key={option.value} value={option.label} onSelect={() => {
                        if (value === option.value) {
                            onValueChange(null); // Deselect
                        } else {
                            onValueChange(option.value); // Select
                        }
                        setOpen(false);
                    }}>
                        <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />{option.label}
                    </CommandItem>))}
                </CommandGroup></CommandList></Command></PopoverContent>
            </Popover>
        </div>
    );
};

export const TextAreaField = ({ label, name, required, hideLabel, ...props }: { label: string; name: string, required?: boolean; hideLabel?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <div className="md:col-span-3">
        {!hideLabel && (
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
        )}
        <Textarea name={name} required={required} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500 disabled:bg-gray-200 disabled:cursor-not-allowed" />
    </div>
);

export const ImageUploadField = ({ label, name, value, onChange, disabled, hideLabel }: { label: string; name: string; value?: File | string | null; onChange: (file: File | null) => void; disabled: boolean; hideLabel?: boolean }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // A string value is assumed to be a URL from the database.
        // We check if it's a valid URL format before setting it as a preview.
        if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('blob:'))) {
            setPreview(value);
        } else if (value instanceof File) {
            // If it's a File object, create a temporary blob URL for preview.
            const objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
            // Clean up the blob URL when the component unmounts or the value changes.
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            // If the value is null, undefined, or an invalid string, don't show a preview.
            setPreview(null);
        }
    }, [value]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        onChange(file);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        if(inputRef.current) {
            inputRef.current.value = "";
        }
    }

    return (
        <div className="md:col-span-3">
            {!hideLabel && (
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            )}
            <div onClick={() => !disabled && inputRef.current?.click()} className={cn("w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 transition-colors", disabled ? "bg-gray-200 cursor-not-allowed" : "border-gray-300 hover:border-red-400 hover:bg-red-50 cursor-pointer")}>
                <input type="file" name={name} accept="image/*" ref={inputRef} onChange={handleFileChange} className="hidden" disabled={disabled} />
                {preview ? (
                    <div className="relative w-full h-48">
                        <Image src={preview} alt="Preview" layout="fill" objectFit="contain" className="rounded-md" />
                        {!disabled && <button type="button" onClick={handleRemove} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md text-gray-600 hover:text-red-600"><X size={16} /></button>}
                    </div>
                ) : (
                    <>
                        <UploadCloud size={32} className="mb-2" />
                        <span>Click to upload an image</span>
                        <span className="text-xs">PNG, JPG, GIF up to 10MB</span>
                    </>
                )}
            </div>
        </div>
    );
};
