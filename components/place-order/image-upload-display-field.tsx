'use client';
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ImagePlus, X } from 'lucide-react';
import { cn } from "@/lib/utils";

export const ImageUploadDisplayField = ({
    label,
    name,
    dbImageUrl,
    file,
    onFileChange,
    disabled
}: {
    label: string;
    name: string;
    dbImageUrl?: string | null;
    file?: File | null;
    onFileChange: (file: File | null) => void;
    disabled: boolean;
}) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isRemoved, setIsRemoved] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            setIsRemoved(false); // A new file is added
            return () => URL.revokeObjectURL(objectUrl);
        } else if (dbImageUrl && !isRemoved) {
            setPreview(dbImageUrl);
        } else {
            setPreview(null);
        }
    }, [dbImageUrl, file, isRemoved]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] || null;
        onFileChange(selectedFile);
        if (selectedFile) {
            setIsRemoved(false); // New file is selected, so it's not "removed"
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFileChange(null);
        setPreview(null);
        setIsRemoved(true); // Mark as removed
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    return (
        <div>
            <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-label={preview ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
                aria-disabled={disabled}
                onClick={() => !disabled && inputRef.current?.click()}
                onKeyDown={(e) => {
                    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        inputRef.current?.click();
                    }
                }}
                className={cn(
                    "relative flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    disabled
                        ? "cursor-not-allowed bg-muted"
                        : "cursor-pointer bg-card hover:border-primary/50 hover:bg-accent/50"
                )}
            >
                <input
                    type="file"
                    name={name}
                    accept="image/*"
                    ref={inputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={disabled}
                />
                {/* Hidden input to track removal of existing DB image */}
                <input
                    type="hidden"
                    name={`${name}_from_form`}
                    value={isRemoved ? 'null' : (dbImageUrl || '')}
                />
                {preview ? (
                    <>
                        <Image src={preview} alt={label} fill sizes="400px" className="rounded-md object-contain p-2" />
                        {!disabled && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                aria-label={`Remove ${label.toLowerCase()}`}
                                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:text-destructive"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        <ImagePlus className="mb-2 size-7" />
                        <span className="font-medium text-foreground">{disabled ? 'No image' : 'Click to upload'}</span>
                        {!disabled && <span className="mt-0.5 text-xs">PNG, JPG or GIF, up to 10 MB</span>}
                    </>
                )}
            </div>
        </div>
    );
};
