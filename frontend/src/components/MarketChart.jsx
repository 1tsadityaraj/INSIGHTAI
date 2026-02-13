import React, { useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

const MarketChart = ({ data, coinName, days, comparisonData = [], isPercentage = false }) => {
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
            <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100 p-10">
                No chart data available
            </div>
        );
    }

    const isComparison = comparisonData && comparisonData.length > 0;

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col w-full">
            <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        {isComparison ? "Market Comparison" : `${coinName} Price Trend`}
                    </h3>
                    <p className="text-sm text-gray-500">Last {days} days history</p>
                </div>

                {/* Indicator Toggles */}
                {!isComparison && (
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showSMA}
                                onChange={(e) => setShowSMA(e.target.checked)}
                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-orange-600 font-medium">SMA (20)</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showEMA}
                                onChange={(e) => setShowEMA(e.target.checked)}
                                className="rounded border-gray-300 text-fuchsia-500 focus:ring-fuchsia-500"
                            />
                            <span className="text-fuchsia-600 font-medium">EMA (20)</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showRSI}
                                onChange={(e) => setShowRSI(e.target.checked)}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span>RSI (14)</span>
                        </label>
                    </div>
                )}
            </div>

            {/* Main Price Chart */}
            <div className={`w-full transition-all duration-300 ${showRSI && !isComparison ? 'h-[250px]' : 'flex-grow min-h-[300px]'}`}>
                <ResponsiveContainer width="100%" height="100%">
                    {isComparison ? (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="date" hide={true} />
                            <YAxis
                                domain={['auto', 'auto']}
                                hide={true}
                                tickFormatter={(val) => isPercentage ? `${val.toFixed(2)}%` : `$${val.toLocaleString()}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value, name) => {
                                    const formatted = isPercentage ? `${value?.toFixed(2)}%` : `$${value?.toLocaleString()}`;
                                    return [formatted, name];
                                }}
                            />
                            <Legend />

                            {/* Base Asset */}
                            <Line type="monotone" dataKey={coinName} stroke={COLORS[0]} strokeWidth={2} dot={false} />

                            {/* Comparison Assets */}
                            {comparisonData.map((comp, i) => (
                                <Line
                                    key={i}
                                    type="monotone"
                                    dataKey={comp.name}
                                    stroke={COLORS[(i + 1) % COLORS.length]}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    ) : (
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                minTickGap={30}
                                hide={showRSI} // Hide X axis if RSI chart is below
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                tickFormatter={(val) => isPercentage ? `${val.toFixed(2)}%` : `$${val.toLocaleString()}`}
                                width={60}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
                                stroke={COLORS[0]}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPrice)"
                            />
                            {showSMA && (
                                <Area
                                    type="monotone"
                                    dataKey="sma"
                                    stroke="#ff7300"
                                    strokeWidth={2}
                                    fill="none"
                                    strokeDasharray="5 5"
                                />
                            )}
                            {showEMA && (
                                <Area
                                    type="monotone"
                                    dataKey="ema"
                                    stroke="#d946ef"
                                    strokeWidth={2}
                                    fill="none"
                                />
                            )}
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* RSI Sub-Chart */}
            {showRSI && !isComparison && (
                <div className="w-full h-[100px] mt-4 pt-4 border-t border-gray-100">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 10 }}
                                minTickGap={30}
                            />
                            <YAxis
                                domain={[0, 100]}
                                hide={false}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 10 }}
                                ticks={[30, 70]}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [value?.toFixed(1), "RSI"]}
                            />
                            {/* Reference Lines */}
                            <Line type="monotone" dataKey={() => 70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} dot={false} activeDot={false} />
                            <Line type="monotone" dataKey={() => 30} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} dot={false} activeDot={false} />

                            {/* RSI Line */}
                            <Line
                                type="monotone"
                                dataKey="rsi"
                                stroke="#8884d8"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default MarketChart;
