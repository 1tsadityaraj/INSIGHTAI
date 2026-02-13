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

const MACDChart = ({ data, days }) => {
    if (!data || !data.labels || data.labels.length === 0) return null;

    const chartData = data.labels.map((label, index) => ({
        date: label,
        macd: data.macd?.[index],
        signal: data.macd_signal?.[index], // Use optional chaining
        histogram: data.macd_histogram?.[index]
    }));

    // Only render if we have valid MACD data
    if (!chartData.some(d => d.macd != null)) return null;

    return (
        <div className="h-48 w-full mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">MACD (12, 26, 9)</h4>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" hide={true} />
                    <YAxis
                        domain={['auto', 'auto']}
                        orientation="right"
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: '#6b7280', fontSize: '12px' }}
                        itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <ReferenceLine y={0} stroke="#e5e7eb" />
                    <Bar dataKey="histogram" name="Histogram" fill="#cbd5e1" barSize={4} />
                    <Line type="monotone" dataKey="macd" name="MACD" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="signal" name="Signal" stroke="#f97316" dot={false} strokeWidth={1.5} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MACDChart;
