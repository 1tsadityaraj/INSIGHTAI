import React, { useState } from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    disabled = false,
    className = '',
    icon: Icon,
    active = false,
    ...props
}) => {
    const [ripples, setRipples] = useState([]);

    const handleClick = (e) => {
        if (disabled) return;

        // Create ripple effect
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const newRipple = { x, y, size, id: Date.now() };
        setRipples([...ripples, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
            setRipples(ripples => ripples.filter(r => r.id !== newRipple.id));
        }, 600);

        if (onClick) onClick(e);
    };

    const baseStyles = "relative overflow-hidden inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed";

    const variants = {
        primary: active
            ? "bg-primary text-white shadow-xl scale-[0.98]"
            : "bg-primary text-white hover:bg-blue-600 focus:ring-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_20px_rgba(59,130,246,0.4)]",
        secondary: active
            ? "bg-surface text-ink scale-[0.98] border border-border"
            : "bg-surface text-ink-dim border border-border hover:bg-base hover:text-ink focus:ring-border",
        outline: active
            ? "border border-primary text-primary bg-primary/5 scale-[0.98]"
            : "border border-border text-ink-dim hover:border-primary hover:text-primary hover:bg-primary/5 focus:ring-primary/30",
        danger: "bg-error text-white hover:bg-red-600 focus:ring-error shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-[0_8px_20px_rgba(239,68,68,0.4)]",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs rounded-lg",
        md: "px-4 py-2 text-sm rounded-lg",
        lg: "px-6 py-3 text-base rounded-xl",
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {/* Ripple effect */}
            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: ripple.size,
                        height: ripple.size,
                    }}
                />
            ))}

            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {children}
        </button>
    );
};

export default Button;
