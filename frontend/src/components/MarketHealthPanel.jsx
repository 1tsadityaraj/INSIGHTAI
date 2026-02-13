import React from "react";
import { Activity, ArrowUp, ArrowDown, TrendingUp, Zap, BarChart2 } from "lucide-react";
import { UI_CONFIG, getHealthColor, getHealthStatus } from "../config/ui-config";

const MarketHealthPanel = ({ scoreData }) => {
    if (!scoreData || !scoreData.components) return null;

    const { score, components } = scoreData;
    const healthColor = getHealthColor(score);
    const status = getHealthStatus(score);
    const isBull = score >= 50;

    return (
        <div className={UI_CONFIG.card.base}>
            <h3 className={`${UI_CONFIG.typography.cardTitle} flex items-center gap-2 mb-3`}>
                <Activity className="w-4 h-4 text-primary" /> Market Health
            </h3>

            {/* Main Score Gauge - Refined */}
            <div className="flex items-center justify-between mb-3">
                <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        {/* Background circle */}
                        <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-border"
                        />
                        {/* Gradient definition */}
                        <defs>
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={isBull ? "#22C55E" : "#EF4444"} />
                                <stop offset="100%" stopColor={isBull ? "#4ADE80" : "#F87171"} />
                            </linearGradient>
                        </defs>
                        {/* Progress circle with radial glow */}
                        <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="url(#gaugeGradient)"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={213.6}
                            strokeDashoffset={213.6 - (213.6 * score) / 100}
                            style={{ filter: `drop-shadow(${healthColor.shadow})` }}
                            className="transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-xl font-bold ${healthColor.text} tracking-tighter`}>{score}</span>
                        <span className="text-[8px] text-ink-muted uppercase tracking-[0.15em] font-semibold">Score</span>
                    </div>
                </div>

                <div className="text-right">
                    <div className={`text-sm font-bold ${healthColor.text} uppercase tracking-tight`}>{status}</div>
                    <p className="text-[9px] text-ink-muted mt-0.5 uppercase tracking-[0.1em] font-medium">Deep Scan Composite</p>
                </div>
            </div>

            {/* Components Breakdown - Premium Progress Bars */}
            <div className="space-y-2 mt-4">
                {[
                    { label: "Momentum", val: components.heatmap, icon: TrendingUp, color: "bg-blue-500" },
                    { label: "RSI Health", val: components.rsi, icon: Activity, color: "bg-accent" },
                    { label: "MACD Signal", val: components.macd, icon: BarChart2, color: "bg-warning" },
                    { label: "Volatility", val: components.volatility, icon: Activity, color: "bg-pink-500" },
                    { label: "Sentiment", val: components.sentiment, icon: Zap, color: "bg-yellow-500" }
                ].map((comp, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-ink-dim flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                                <comp.icon className="w-2.5 h-2.5 opacity-70" /> {comp.label}
                            </span>
                            <span className="text-ink font-bold">{(comp.val || 0).toFixed(1)}</span>
                        </div>
                        <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${comp.color} transition-all duration-500 ease-out rounded-full`}
                                style={{ width: `${(comp.val || 0) * 10}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketHealthPanel;
