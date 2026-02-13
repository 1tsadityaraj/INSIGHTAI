import React, { useState, useEffect } from "react";
import { Plus, Trash2, PieChart, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { market } from "../services/market"; // To update prices dynamically

const Portfolio = ({ active }) => {
    const [holdings, setHoldings] = useState([]);
    const [prices, setPrices] = useState({});
    const [totalValue, setTotalValue] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    // Note: To calculate true PnL, we need avg buy price. 
    // User requirement just says: "amount * current_price". 
    // "PnL display" usually implies (Current Value - Cost Basis).
    // The requirement "Client-Side Storage: [{symbol, amount}]" doesn't strictly track cost basis.
    // However, "Live PnL display" is requested.
    // I will add an optional "avgPrice" field to the add modal, defaulting to current price if unknown.
    // If not provided, PnL might just be 24h change? "PnL values" usually means profit from entry.
    // I'll stick to 24h PnL if cost basis is missing, or ask user? 
    // Prompt says: "Portfolio Mode (DB-Free)... Client-Side Storage: [{symbol, amount}]".
    // It does not explicitly list 'cost'. 
    // BUT "Color-coded profit/loss" implies it. 
    // I will enhance the storage to `[{symbol, amount, avgPrice}]` for better UX.

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCoin, setNewCoin] = useState("bitcoin");
    const [newAmount, setNewAmount] = useState("");
    const [newAvgPrice, setNewAvgPrice] = useState("");

    // Load from local storage
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("portfolio")) || [];
        setHoldings(stored);
    }, []);

    // Save to local storage
    useEffect(() => {
        localStorage.setItem("portfolio", JSON.stringify(holdings));
    }, [holdings]);

    // Fetch prices for holdings
    useEffect(() => {
        if (!active || holdings.length === 0) return;

        const fetchPrices = async () => {
            const symbols = holdings.map(h => h.symbol);
            if (symbols.length === 0) return;

            // We can use comparison endpoint or heatmap or individual.
            // Comparison endpoint normalizes data, not ideal for raw price.
            // Heatmap has top 10.
            // Best: Loop fetch (parallel) or use a "multi-price" endpoint if available.
            // We don't have a multi-price endpoint. We'll use get_coin_data in parallel.
            // Or better, use the new WebSocket if possible? 
            // For now, simple parallel fetch.

            const checks = symbols.map(sym => market.fetchMarketData(sym, "1")); // 1 day for minimal chart data
            try {
                const results = await Promise.all(checks);
                const priceMap = {};
                results.forEach((res, idx) => {
                    if (res && res.kpi) {
                        priceMap[holdings[idx].symbol] = {
                            price: res.kpi.current_price_usd,
                            change_24h: res.kpi.price_change_percentage_24h
                        };
                    }
                });
                setPrices(priceMap);
            } catch (e) {
                console.error("Portfolio Price Fetch Error", e);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [holdings, active]);

    // Calculate totals
    useEffect(() => {
        let val = 0;
        let cost = 0;
        holdings.forEach(h => {
            const p = prices[h.symbol]?.price || 0;
            val += h.amount * p;
            cost += h.amount * (h.avgPrice || p); // detailed PnL fallback
        });
        setTotalValue(val);
        setTotalCost(cost);
    }, [prices, holdings]);

    const addAsset = () => {
        if (!newAmount || isNaN(newAmount)) return;
        const exists = holdings.find(h => h.symbol === newCoin);
        if (exists) {
            // Update amount
            const updated = holdings.map(h => h.symbol === newCoin ? { ...h, amount: parseFloat(h.amount) + parseFloat(newAmount) } : h);
            setHoldings(updated);
        } else {
            // For a real app we'd fetch current price to default avgPrice, but here relying on user or 0
            setHoldings([...holdings, {
                symbol: newCoin,
                amount: parseFloat(newAmount),
                avgPrice: parseFloat(newAvgPrice) || prices[newCoin]?.price || 0
            }]);
        }
        setIsModalOpen(false);
        setNewAmount("");
        setNewAvgPrice("");
    };

    const removeAsset = (symbol) => {
        setHoldings(holdings.filter(h => h.symbol !== symbol));
    };

    if (!active) return null;

    const totalPnL = totalValue - totalCost;
    const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Portfolio Simulator</h2>
                    <p className="text-gray-400 text-sm">Track your crypto holdings (Stored locally)</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Add Asset
                </button>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Balance</h3>
                    <div className="text-3xl font-bold text-gray-900">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Profit/Loss</h3>
                    <div className={`text-3xl font-bold flex items-center gap-2 ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className={`text-sm px-2 py-1 rounded-full ${totalPnLPct >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                            {totalPnLPct.toFixed(2)}%
                        </span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center">
                    {/* Placeholder for Allocation Pie Chart */}
                    <div className="text-center text-gray-400 text-xs">
                        <PieChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Allocation Chart
                    </div>
                </div>
            </div>

            {/* Assets List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                            <th className="p-4">Asset</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Balance</th>
                            <th className="p-4">Value</th>
                            <th className="p-4">24h Change</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {holdings.map((h) => {
                            const p = prices[h.symbol];
                            const currentPrice = p?.price || 0;
                            const val = h.amount * currentPrice;
                            return (
                                <tr key={h.symbol} className="hover:bg-gray-50/50 transition">
                                    <td className="p-4 font-bold text-gray-800 uppercase">{h.symbol}</td>
                                    <td className="p-4">${currentPrice.toLocaleString()}</td>
                                    <td className="p-4 text-gray-600">{h.amount}</td>
                                    <td className="p-4 font-mono font-medium">${val.toLocaleString()}</td>
                                    <td className="p-4">
                                        {p?.change_24h ? (
                                            <span className={`flex items-center gap-1 ${p.change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {p.change_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {Math.abs(p.change_24h).toFixed(2)}%
                                            </span>
                                        ) : <span className="text-gray-300">--</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => removeAsset(h.symbol)} className="text-gray-400 hover:text-red-500 transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {holdings.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-400">
                                    No assets in portfolio. Click "Add Asset" to start believing.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
                        <h3 className="font-bold text-lg mb-4">Add Asset</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Symbol (e.g. bitcoin)</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-primary"
                                    value={newCoin}
                                    onChange={e => setNewCoin(e.target.value.toLowerCase())}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Amount</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-primary"
                                    value={newAmount}
                                    onChange={e => setNewAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Avg Buy Price (Optional)</label>
                                <input
                                    type="number"
                                    placeholder="Leave empty for current price"
                                    className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-primary"
                                    value={newAvgPrice}
                                    onChange={e => setNewAvgPrice(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                            <button onClick={addAsset} className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 font-bold">Add</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolio;
