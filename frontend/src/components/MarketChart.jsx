import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MarketChart = ({ data, coinName, days }) => {
    // Expect data = { labels: [...], values: [...] }
    if (!data || !data.values || data.values.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                No chart data available
            </div>
        );
    }

    // Map labels/values to Recharts format
    const formattedData = data.values.map((val, i) => ({
        date: data.labels[i],
        price: val
    }));

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{coinName} Price Trend</h3>
                <p className="text-sm text-gray-500">Last {days} days history</p>
            </div>

            <div className="flex-grow min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedData}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
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
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [`$${value.toLocaleString()}`, 'Price']}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#8884d8"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MarketChart;
