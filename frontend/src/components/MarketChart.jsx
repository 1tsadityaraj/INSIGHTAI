import React, { useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { UI_CONFIG } from '../config/ui-config';

const COLORS = ["#60A5FA", "#82ca9d", "#ffc658", "#ff7300"];

const MarketChart = ({ data, coinName, days, comparisonData = [], isPercentage = false }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const isTradingViewDark = isDark; // For semantic clarity
    const gridColor = isTradingViewDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const tickColor = isTradingViewDark ? '#9CA3AF' : '#6B7280';
    const tooltipBg = isTradingViewDark ? '#1F2937' : '#FFFFFF';
    const tooltipBorder = isTradingViewDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const [showSMA, setShowSMA] = React.useState(true);
    const [showEMA, setShowEMA] = React.useState(true);
    const [showRSI, setShowRSI] = React.useState(true);

    // 1. Memoize Data Processing
    const chartData = useMemo(() => {
        if (!data || !data.values) return [];

        // Base Data
        const base = data.values.map((val, i) => ({
            date: data.labels[i],
            [coinName]: val,
            sma: data.sma ? data.sma[i] : null,
            ema: data.ema ? data.ema[i] : null,
            rsi: data.rsi ? data.rsi[i] : null
        }));

        // Merge Comparison Data (Simple Index Matching for MVP)
        // In prod, use real timestamp alignment
        if (comparisonData && comparisonData.length > 0) {
            comparisonData.forEach((comp, idx) => {
                const compName = comp.name || `Asset ${idx + 1}`;
                const compValues = comp.values || comp.chart_data?.values || [];

                base.forEach((item, i) => {
                    if (compValues[i] !== undefined) {
                        item[compName] = compValues[i];
                    }
                });
            });
        }
        return base;

    }, [data, coinName, comparisonData]);

    if (chartData.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-ink-dim bg-surface rounded-2xl border border-border p-10 font-bold uppercase tracking-widest">
                No Protocol Data Available
            </div>
        );
    }

    const isComparison = comparisonData && comparisonData.length > 0;

    return (
        <div className="bg-surface-top border border-border card-luxury rounded-2xl h-full flex flex-col w-full p-6 transition-all duration-300">
            <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
                <div>
                    <h3 className="text-[17px] font-bold text-ink uppercase tracking-tight">
                        {isComparison ? "Market Comparison Protocol" : `${coinName} Precision Trend`}
                    </h3>
                    <p className="text-[10px] text-ink-muted/80 uppercase tracking-[0.15em] font-semibold mt-1">Institutional scan: {days}D window</p>
                </div>

                {/* Indicator Toggles */}
                {!isComparison && (
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center space-x-2 text-sm text-ink-dim cursor-pointer hover:text-ink transition-colors">
                            <input
                                type="checkbox"
                                checked={showSMA}
                                onChange={(e) => setShowSMA(e.target.checked)}
                                className="rounded border-border bg-surface text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-[#F97316] font-medium">SMA (20)</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-ink-dim cursor-pointer hover:text-ink transition-colors">
                            <input
                                type="checkbox"
                                checked={showEMA}
                                onChange={(e) => setShowEMA(e.target.checked)}
                                className="rounded border-border bg-surface text-purple-500 focus:ring-purple-500"
                            />
                            <span className="text-[#A855F7] font-medium">EMA (20)</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-ink-dim cursor-pointer hover:text-ink transition-colors">
                            <input
                                type="checkbox"
                                checked={showRSI}
                                onChange={(e) => setShowRSI(e.target.checked)}
                                className="rounded border-border bg-surface text-indigo-400 focus:ring-indigo-400"
                            />
                            <span className="text-[#A78BFA] font-medium">RSI (14)</span>
                        </label>
                    </div>
                )}
            </div>

            {/* Main Price Chart */}
            <div className={`w-full transition-all duration-300 ${showRSI && !isComparison ? 'h-[250px]' : 'flex-grow min-h-[300px]'}`}>
                <ResponsiveContainer width="100%" height="100%">
                    {isComparison ? (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f0f0f0'} />
                            <XAxis dataKey="date" hide={true} />
                            <YAxis
                                domain={['auto', 'auto']}
                                hide={true}
                                tickFormatter={(val) => isPercentage ? `${val.toFixed(2)}%` : `$${val.toLocaleString()}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: isDark ? '1px solid #334155' : 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: isDark ? '#1f2937' : '#fff', color: isDark ? '#f8fafc' : '#111' }}
                                formatter={(value, name) => {
                                    const formatted = isPercentage ? `${value?.toFixed(2)}%` : `$${value?.toLocaleString()}`;
                                    return [formatted, name];
                                }}
                            />
                            <Legend />

                            {/* Base Asset */}
                            <Line type="monotone" dataKey={coinName} stroke={COLORS[0]} strokeWidth={2.5} dot={false} />

                            {/* Comparison Assets */}
                            {comparisonData.map((comp, i) => (
                                <Line
                                    key={i}
                                    type="monotone"
                                    dataKey={comp.name}
                                    stroke={COLORS[(i + 1) % COLORS.length]}
                                    strokeWidth={2.2}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    ) : (
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.15} />
                                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.01} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.4} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: tickColor, fontSize: 10, fontWeight: 500 }}
                                minTickGap={30}
                                hide={showRSI} // Hide X axis if RSI chart is below
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: tickColor, fontSize: 10, fontWeight: 500 }}
                                tickFormatter={(val) => isPercentage ? `${val.toFixed(2)}%` : `$${val.toLocaleString()}`}
                                width={50}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: `1px solid ${tooltipBorder}`, boxShadow: '0 8px 24px rgba(0,0,0,0.35)', backgroundColor: tooltipBg, color: isTradingViewDark ? '#F9FAFB' : '#111' }}
                                formatter={(value, name) => {
                                    if (name === "sma") return [value?.toFixed(2), "SMA (20)"];
                                    if (name === "ema") return [value?.toFixed(2), "EMA (20)"];

                                    const formatted = isPercentage ? `${value?.toFixed(2)}%` : `$${value?.toLocaleString()}`;
                                    const label = isPercentage ? `${name}` : (name === coinName ? 'Price' : name);

                                    return [formatted, label];
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey={coinName}
                                stroke="#79B6FF" // Lightened by 10% for Dark Mode
                                strokeWidth={2.8}
                                fillOpacity={1}
                                fill="url(#colorPrice)"
                                animationDuration={1200}
                                isAnimationActive={true}
                            />
                            {showSMA && (
                                <Area
                                    type="monotone"
                                    dataKey="sma"
                                    stroke="#FB923C" // Lightened Orange focal
                                    strokeWidth={2}
                                    fill="none"
                                    strokeDasharray="5 5"
                                    opacity={0.9}
                                />
                            )}
                            {showEMA && (
                                <Area
                                    type="monotone"
                                    dataKey="ema"
                                    stroke="#C084FC" // Lightened Purple focal
                                    strokeWidth={2}
                                    fill="none"
                                    opacity={0.9}
                                />
                            )}
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* RSI Sub-Chart */}
            {showRSI && !isComparison && (
                <div className="w-full h-[100px] mt-4 pt-4 border-t border-border/30">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.3} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: tickColor, fontSize: 9 }}
                                minTickGap={30}
                            />
                            <YAxis
                                domain={[0, 100]}
                                hide={false}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: tickColor, fontSize: 9, fontWeight: 500 }}
                                ticks={[30, 70]}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: `1px solid ${tooltipBorder}`, boxShadow: '0 8px 12px rgba(0,0,0,0.2)', backgroundColor: tooltipBg, color: isTradingViewDark ? '#F9FAFB' : '#111', fontSize: '10px' }}
                                formatter={(value) => [value?.toFixed(1), "RSI"]}
                            />
                            {/* RSI Line */}
                            <Line
                                type="monotone"
                                dataKey="rsi"
                                stroke="#A78BFA"
                                strokeWidth={1.8}
                                dot={false}
                            />
                            <rect y={30} width="100%" height={40} fill="rgba(167, 139, 250, 0.03)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default MarketChart;
