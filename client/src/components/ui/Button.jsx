import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    loading = false,
    disabled = false,
    className = "",
    type = "button",
    onClick,
    ...props
}) => {
    return (
        <button
            type={type}
            disabled={loading || disabled}
            onClick={onClick}
            className={`relative inline-flex items-center justify-center gap-2 transition-all duration-300 min-h-[44px] ${className} ${(loading || disabled) ? "opacity-70 cursor-not-allowed" : ""
                }`}
            {...props}
        >
            {loading && <Loader2 className="h-5 w-5 animate-spin shrink-0" />}
            <span className={`flex items-center justify-center gap-2 transition-opacity duration-300 ${loading ? "opacity-90" : "opacity-100"}`}>
                {children}
            </span>
        </button>
    );
};

export default Button;
