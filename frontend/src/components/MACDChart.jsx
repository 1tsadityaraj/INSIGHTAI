import React, { useRef, useEffect } from "react";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";
import { useTheme } from '../context/ThemeContext';

const MACDChart = ({ data, days }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    if (!data || !data.labels || data.labels.length === 0) return null;

    const chartData = data.labels.map((label, index) => ({
        date: label,
        macd: data.macd?.[index],
        signal: data.macd_signal?.[index], // Use optional chaining
        histogram: data.macd_histogram?.[index]
    }));

    // Only render if we have valid MACD data
    if (!chartData.some(d => d.macd != null)) return null;

    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const tickColor = isDark ? '#9CA3AF' : '#6B7280';
    const tooltipBg = isDark ? '#1F2937' : '#FFFFFF';
    const tooltipBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    return (
        <div className="h-48 w-full mt-4 bg-surface rounded-xl border border-border shadow-[0_8px_24px_rgba(0,0,0,0.35)] p-4">
            <h4 className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2">MACD Signal Protocol (12, 26, 9)</h4>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="date" hide={true} />
                    <YAxis
                        domain={['auto', 'auto']}
                        orientation="right"
                        tick={{ fontSize: 10, fill: tickColor }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: `1px solid ${tooltipBorder}`, boxShadow: '0 8px 24px rgba(0,0,0,0.35)', backgroundColor: tooltipBg, color: isDark ? '#F9FAFB' : '#111' }}
                        labelStyle={{ color: tickColor, fontSize: '12px' }}
                        itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <ReferenceLine y={0} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} strokeDasharray="3 3" />
                    <Bar
                        dataKey="histogram"
                        name="Histogram"
                        fill={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                        barSize={4}
                    />
                    <Line type="monotone" dataKey="macd" name="MACD" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="signal" name="Signal" stroke="#f97316" dot={false} strokeWidth={1.5} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MACDChart;
