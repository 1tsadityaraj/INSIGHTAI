import React, { useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

const MarketChart = ({ data, coinName, days, comparisonData = [] }) => {

    // 1. Memoize Data Processing
    const chartData = useMemo(() => {
        if (!data || !data.values) return [];

        // Base Data
        const base = data.values.map((val, i) => ({
            date: data.labels[i],
            [coinName]: val
        }));

        // Merge Comparison Data (Simple Index Matching for MVP)
        // In prod, use real timestamp alignment
        if (comparisonData && comparisonData.length > 0) {
            comparisonData.forEach((comp, idx) => {
                const compName = comp.name || `Asset ${idx + 1}`;
                const compValues = comp.chart_data?.values || [];

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
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        {isComparison ? "Market Comparison" : `${coinName} Price Trend`}
                    </h3>
                    <p className="text-sm text-gray-500">Last {days} days history</p>
                </div>
            </div>

            <div className="flex-grow min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {isComparison ? (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="date" hide={true} />
                            <YAxis domain={['auto', 'auto']} hide={true} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                tickFormatter={(val) => `$${val.toLocaleString()}`}
                                width={60}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`$${value.toLocaleString()}`, 'Price']}
                            />
                            <Area
                                type="monotone"
                                dataKey={coinName}
                                stroke={COLORS[0]}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPrice)"
                            />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MarketChart;
