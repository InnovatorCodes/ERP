import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode; // For action buttons
    className?: string;
}

export const PageHeader = ({
    title,
    description,
    children,
    className,
}: PageHeaderProps) => {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6", className)}>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
};
