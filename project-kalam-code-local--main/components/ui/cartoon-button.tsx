import React from 'react';
import { cn } from "@/lib/utils";

interface CartoonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
    color?: string;
    hasHighlight?: boolean;
}

export function CartoonButton({
    label,
    children,
    color = 'bg-black/40',
    hasHighlight = true,
    disabled = false,
    onClick,
    className,
    ...props
}: CartoonButtonProps) {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;
        onClick?.(e as any);
    };

    return (
        <div
            className={cn(
                "inline-block",
                disabled ? "cursor-not-allowed" : "cursor-pointer",
                className
            )}
        >
            <button
                disabled={disabled}
                onClick={handleClick}
                className={cn(
                    "relative h-12 px-6 text-sm rounded-xl font-black uppercase tracking-wider text-white border-2 border-white/10 transition-all duration-150 overflow-hidden group backdrop-blur-md",
                    "shadow-[0_5px_0_0_#000000] active:shadow-none active:translate-y-[2px]",
                    "hover:-translate-y-[2px] hover:shadow-[0_7px_0_0_#000000]",
                    color,
                    disabled ? "opacity-50 pointer-events-none" : ""
                )}
                {...props}
            >
                <div className="relative z-10 flex items-center justify-center gap-2">
                    {label || children}
                </div>

                {hasHighlight && !disabled && (
                    <div className="absolute top-1/2 left-[-100%] w-24 h-48 bg-white/20 -translate-y-1/2 rotate-[35deg] transition-all duration-700 ease-in-out group-hover:left-[200%] pointer-events-none"></div>
                )}

                {/* Glossy top reflection */}
                <div className="absolute inset-x-0 top-0 h-px bg-white/20 z-20" />
            </button>
        </div>
    );
}
