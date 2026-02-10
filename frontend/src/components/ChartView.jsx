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

/**
 * ChartView Component
 * Renders a responsive bar chart using Recharts.
 * @param {Object} data - Schema: { title, labels: [], values: [], x_label?, y_label? }
 */
const ChartView = ({ data }) => {
    if (!data || !data.labels || !data.values || data.values.length === 0) {
        return null;
    }

    // Transform data format for Recharts (Array of Objects)
    const chartData = data.labels.map((label, index) => ({
        name: label,
        value: data.values[index],
    }));

    return (
        <div className="mt-6 mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
                {data.title || "Data Visualization"}
            </h3>
            <div className="h-64 w-full" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#6B7280" }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#6B7280" }}
                        />
                        <Tooltip
                            cursor={{ fill: "#F3F4F6" }}
                            contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                        />
                        <Bar
                            dataKey="value"
                            fill="#3B82F6"
                            radius={[4, 4, 0, 0]}
                            barSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {(data.x_label || data.y_label) && (
                <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
                    <span>{data.x_label}</span>
                    <span>{data.y_label}</span>
                </div>
            )}
        </div>
    );
};

export default ChartView;
