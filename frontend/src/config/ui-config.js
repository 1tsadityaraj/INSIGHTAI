// UI Configuration - Centralized style constants for InsightAI (Premium Polish)

export const UI_CONFIG = {
    // Card Styles (Refined)
    card: {
        base: "h-full min-h-[110px] p-5 rounded-2xl border border-border bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.35)] flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200 ease-out",
        section: "bg-surface rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] border border-border p-6 mb-6",
    },

    // Typography (Refined weights)
    typography: {
        pageTitle: "text-2xl font-semibold text-ink", // 600 weight for headings
        sectionTitle: "text-lg font-semibold text-ink mb-4",
        cardTitle: "text-[11px] text-ink-dim font-medium uppercase tracking-[0.08em]",
        cardValue: "text-[30px] font-medium text-ink leading-none", // 500 for KPI values
        subLabel: "text-sm text-ink-dim font-normal", // 400 for descriptions
        number: "text-[30px] font-medium",
    },

    // Spacing (8px grid system)
    spacing: {
        micro: "8px",
        default: "16px",
        section: "24px",
        major: "32px",
        sectionGap: "mb-6",
        internalPadding: "p-6",
        smallGap: "gap-2",
        mediumGap: "gap-4",
        largeGap: "gap-6",
        cardPadding: "p-5",
        titleValueGap: "mt-1.5",
    },

    // Colors
    colors: {
        positive: "text-success",
        negative: "text-error",
        neutral: "text-ink-dim",
        border: "border-border",
        background: "var(--color-base)",
    },

    // Transitions (Refined)
    transitions: {
        default: "transition-all duration-150 ease-out",
        fast: "transition-all duration-100 ease-out",
        slow: "transition-all duration-300 ease-in-out",
    },

    // Shadows
    shadows: {
        card: "shadow-md",
        cardHover: "shadow-lg",
        tooltip: "shadow-xl",
    },
};

// Heatmap color intensity calculator (Institutional Style)
export const getHeatmapColor = (changePercent) => {
    const intensity = Math.min(Math.abs(changePercent) / 5, 1); // Cap at 5% for full intensity

    if (changePercent > 0) {
        return `rgba(34, 197, 94, ${0.15 + intensity * 0.35})`; // Green with dynamic intensity
    } else if (changePercent < 0) {
        return `rgba(239, 68, 68, ${0.15 + intensity * 0.35})`; // Red with dynamic intensity
    }
    return `rgba(156, 163, 175, 0.15)`; // Gray for 0%
};

// Market Health color based on score (Institutional Polish)
export const getHealthColor = (score) => {
    if (score >= 75) return { bg: "bg-success", text: "text-success", shadow: "0 0 12px rgba(34,197,94,0.3)" };
    if (score >= 60) return { bg: "bg-success", text: "text-success", shadow: "0 0 8px rgba(34,197,94,0.2)" };
    if (score >= 40) return { bg: "bg-ink-dim", text: "text-ink-dim", shadow: "0 0 0px transparent" };
    if (score >= 25) return { bg: "bg-error", text: "text-error", shadow: "0 0 8px rgba(239,68,68,0.2)" };
    return { bg: "bg-error", text: "text-error", shadow: "0 0 12px rgba(239,68,68,0.3)" };
};

// Market Health status text
export const getHealthStatus = (score) => {
    if (score >= 75) return "Strong Buy";
    if (score >= 60) return "Bullish";
    if (score >= 40) return "Neutral";
    if (score >= 25) return "Bearish";
    return "Strong Sell";
};

// Format price with proper decimals
export const formatPrice = (price) => {
    if (price >= 1000) {
        return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

// Format large numbers (market cap, volume)
export const formatLargeNumber = (num) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
};
