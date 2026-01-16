import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    fullWidth?: boolean;
}

export const PageContainer = ({
    children,
    className,
    fullWidth = false,
    ...props
}: PageContainerProps) => {
    return (
        <div
            className={cn(
                "flex-1 p-4 md:p-6 lg:p-8 w-full mx-auto",
                !fullWidth && "max-w-7xl",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
