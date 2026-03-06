import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Activity } from "lucide-react";
import { market } from "../services/market";
import { UI_CONFIG, formatPrice, formatLargeNumber } from "../config/ui-config";

const HeatmapGrid = () => {
    const [coins, setCoins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredCoin, setHoveredCoin] = useState(null);

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

    if (loading) return <div className="h-48 ui-panel ui-shimmer"></div>;

    return (
        <div className={UI_CONFIG.card.section}>
            <h3 className={`${UI_CONFIG.typography.sectionTitle} flex items-center gap-2 mb-6`}>
                <Activity className="w-5 h-5 text-primary" /> Market Heatmap (Top 10)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {coins.map((coin) => {
                    const isPositive = coin.change_24h >= 0;
                    const isHovered = hoveredCoin === coin.id;

                    // Specific trading gradients
                    const gradient = isPositive
                        ? 'linear-gradient(135deg, #14532D, #22C55E)'
                        : 'linear-gradient(135deg, #7F1D1D, #EF4444)';

                    return (
                        <div
                            key={coin.id}
                            className="relative rounded-2xl p-4 flex flex-col justify-center items-center transition-all duration-200 cursor-pointer border border-white/10 hover:-translate-y-0.5"
                            style={{ background: gradient }}
                            onMouseEnter={() => setHoveredCoin(coin.id)}
                            onMouseLeave={() => setHoveredCoin(null)}
                        >
                            <span className="font-bold text-base text-white shadow-sm">{coin.symbol.toUpperCase()}</span>
                            <div className="flex items-center text-sm font-bold mt-1 text-white/90">
                                {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                                {Math.abs(coin.change_24h).toFixed(2)}%
                            </div>

                            {/* Premium Tooltip */}
                            {isHovered && (
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 ui-popover p-3 z-50 w-56 text-left pointer-events-none">
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            <span className="text-ink-dim">Price:</span>
                                            <span className="font-semibold text-ink ml-auto">${formatPrice(coin.price)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                            <span className="text-ink-dim">Market Cap:</span>
                                            <span className="font-semibold text-ink ml-auto">{formatLargeNumber(coin.market_cap)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                            <span className="text-ink-dim">24h Vol:</span>
                                            <span className="font-semibold text-ink ml-auto">{formatLargeNumber(coin.volume)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HeatmapGrid;
