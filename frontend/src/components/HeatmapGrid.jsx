import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Activity } from "lucide-react";
import { market } from "../services/market";

const HeatmapGrid = () => {
    const [coins, setCoins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const fetchHeatmap = async () => {
            const data = await market.fetchHeatmap(10);
            if (active && data) {
                setCoins(data);
                setLoading(false);
            }
        };
        fetchHeatmap();
        // Refresh every 5 minutes
        const interval = setInterval(fetchHeatmap, 300000);
        return () => { active = false; clearInterval(interval); };
    }, []);

    const getIntensityColor = (change) => {
        if (change > 10) return "bg-green-500 text-white";
        if (change > 5) return "bg-green-400 text-white";
        if (change > 0) return "bg-green-300 text-green-900";
        if (change > -5) return "bg-red-300 text-red-900";
        if (change > -10) return "bg-red-400 text-white";
        return "bg-red-500 text-white";
    };

    if (loading) return <div className="h-48 bg-gray-50 rounded-xl animate-pulse"></div>;

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Market Heatmap (Top 10)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 h-48">
                {coins.map((coin) => (
                    <div
                        key={coin.id}
                        className={`rounded-lg p-2 flex flex-col justify-center items-center transition-transform hover:scale-105 cursor-pointer ${getIntensityColor(coin.change_24h)}`}
                        title={`$${coin.price.toLocaleString()} | Vol: $${(coin.volume / 1e9).toFixed(1)}B`}
                    >
                        <span className="font-bold text-sm">{coin.symbol}</span>
                        <div className="flex items-center text-xs font-mono mt-1">
                            {coin.change_24h >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {Math.abs(coin.change_24h).toFixed(2)}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HeatmapGrid;
