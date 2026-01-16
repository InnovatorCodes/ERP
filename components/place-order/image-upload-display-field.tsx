'use client';
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X } from 'lucide-react';
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
    const [isLoading] = useState(false);
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
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div
                onClick={() => !disabled && inputRef.current?.click()}
                className={cn(
                    "w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 transition-colors",
                    disabled
                        ? "bg-gray-200 cursor-not-allowed"
                        : "border-gray-300 hover:border-red-400 hover:bg-red-50 cursor-pointer"
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
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <p>Loading...</p>
                    </div>
                ) : preview ? (
                    <div className="relative w-full h-48">
                        <Image src={preview} alt="Preview" layout="fill" objectFit="contain" className="rounded-md" />
                        {!disabled && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md text-gray-600 hover:text-red-600"
                            >
                                <X size={16} />
                            </button>
                        )}
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
