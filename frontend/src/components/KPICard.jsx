import React from 'react';
import { UI_CONFIG } from '../config/ui-config';

const KPICard = ({ label, value, subValue, icon: Icon, trend, showLiveIndicator = false }) => {
    const isPositive = trend === 'up';
    const isNegative = trend === 'down';

    return (
        <div className="h-full min-h-[110px] p-5 rounded-2xl border border-border bg-surface card-luxury flex flex-col justify-between group">
            {/* Header with icon */}
            <div className="flex justify-between items-start">
                <span className="text-[10px] text-ink-dim font-bold uppercase tracking-[0.12em] opacity-80">{label}</span>
                <div className="flex items-center gap-2">
                    {showLiveIndicator && (
                        <div className="relative">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-success opacity-40"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success shadow-[0_0_8px_rgba(0,230,118,0.6)]"></span>
                            </span>
                        </div>
                    )}
                    {Icon && <Icon className="w-3.5 h-3.5 text-ink-muted opacity-60 group-hover:opacity-100 transition-opacity" />}
                </div>
            </div>

            {/* Value - baseline aligned */}
            <div className={`flex items-baseline mt-2`}>
                <h3 className="text-[28px] font-bold text-ink leading-none tracking-tight">{value}</h3>
            </div>

            {/* Subvalue - anchored to bottom-left */}
            {subValue && (
                <div className={`text-[11px] font-bold mt-2 flex items-center tracking-wide uppercase ${isPositive ? 'text-success' :
                    isNegative ? 'text-error' :
                        'text-ink-dim opacity-60'
                    }`}>
                    {subValue}
                </div>
            )}
        </div>
    );
};

export default KPICard;
