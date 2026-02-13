import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useTheme } from "../context/ThemeContext";

/**
 * ChartView Component
 * Renders a responsive bar chart using Recharts.
 * @param {Object} data - Schema: { title, labels: [], values: [], x_label?, y_label? }
 */
const ChartView = ({ data }) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    if (!data || !data.labels || !data.values || data.values.length === 0) {
        return null;
    }

    // Transform data format for Recharts (Array of Objects)
    const chartData = data.labels.map((label, index) => ({
        name: label,
        value: data.values[index],
    }));

    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const tickColor = isDark ? '#9CA3AF' : '#6B7280';
    const tooltipBg = isDark ? '#1F2937' : '#FFFFFF';
    const tooltipBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    return (
        <div className="mt-6 mb-4 p-5 bg-surface rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] border border-border transition-all duration-200">
            <h3 className="text-sm font-semibold text-ink mb-6 opacity-80 uppercase tracking-widest">
                {data.title || "Data Visualization"}
            </h3>
            <div className="h-64 w-full" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: tickColor }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: tickColor }}
                        />
                        <Tooltip
                            cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
                            contentStyle={{
                                borderRadius: "12px",
                                border: `1px solid ${tooltipBorder}`,
                                boxShadow: "0_8px_24px_rgba(0,0,0,0.35)",
                                backgroundColor: tooltipBg,
                                color: isDark ? "#F9FAFB" : "#111827"
                            }}
                        />
                        <Bar
                            dataKey="value"
                            fill="var(--color-primary)"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                            className="transition-all duration-300 hover:opacity-80"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {(data.x_label || data.y_label) && (
                <div className="flex justify-between text-[10px] text-ink-dim/50 mt-4 px-2 uppercase font-bold tracking-tighter">
                    <span>{data.x_label}</span>
                    <span>{data.y_label}</span>
                </div>
            )}
        </div>
    );
};

export default ChartView;
