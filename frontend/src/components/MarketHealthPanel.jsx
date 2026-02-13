import React from "react";
import { Activity, ArrowUp, ArrowDown, TrendingUp, Zap, BarChart2 } from "lucide-react";

const getScoreColor = (score) => {
    if (score >= 75) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-green-500 bg-green-50";
    if (score <= 25) return "text-red-600 bg-red-100";
    if (score <= 40) return "text-red-500 bg-red-50";
    return "text-gray-600 bg-gray-100";
};

const MarketHealthPanel = ({ scoreData }) => {
    if (!scoreData || !scoreData.components) return null;

    const { score, status, components } = scoreData;
    const colorClass = getScoreColor(score);
    const isBull = score >= 50;

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Market Health
            </h3>

            {/* Main Score Gauge */}
            <div className="flex items-center justify-between mb-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-gray-100"
                        />
                        <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * score) / 100}
                            className={`${isBull ? "text-green-500" : "text-red-500"} transition-all duration-1000 ease-out`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${isBull ? "text-green-600" : "text-red-600"}`}>{score}</span>
                        <span className="text-[10px] text-gray-400 uppercase">Score</span>
                    </div>
                </div>

                <div className="text-right">
                    <div className={`text-lg font-bold ${isBull ? "text-green-600" : "text-red-600"}`}>{status}</div>
                    <p className="text-xs text-gray-400 mt-1">AI Composite metric</p>
                </div>
            </div>

            {/* Components Breakdown */}
            <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Momentum</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${(components.heatmap || 0) * 5}%` }}></div>
                    </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 flex items-center gap-1"><Activity className="w-3 h-3" /> RSI Health</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${(components.rsi || 0) * 5}%` }}></div>
                    </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 flex items-center gap-1"><BarChart2 className="w-3 h-3" /> MACD Signal</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: `${(components.macd || 0) * 5}%` }}></div>
                    </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 flex items-center gap-1"><Activity className="w-3 h-3" /> Volatility</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500" style={{ width: `${(components.volatility || 0) * 5}%` }}></div>
                    </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 flex items-center gap-1"><Zap className="w-3 h-3" /> Sentiment</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500" style={{ width: `${(components.sentiment || 0) * 5}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketHealthPanel;
