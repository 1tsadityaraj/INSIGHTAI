import React, { useState, useEffect } from "react";
import { Plus, Trash2, PieChart, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { market } from "../services/market";
import { UI_CONFIG } from "../config/ui-config";
import Button from "./Button";

const Portfolio = ({ active }) => {
    const [holdings, setHoldings] = useState([]);
    const [prices, setPrices] = useState({});
    const [totalValue, setTotalValue] = useState(0);
    const [totalCost, setTotalCost] = useState(0);

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

            const checks = symbols.map(sym => market.fetchMarketData(sym, "1"));
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
        const interval = setInterval(fetchPrices, 60000);
        return () => clearInterval(interval);
    }, [holdings, active]);

    // Calculate totals
    useEffect(() => {
        let val = 0;
        let cost = 0;
        holdings.forEach(h => {
            const p = prices[h.symbol]?.price || 0;
            val += h.amount * p;
            cost += h.amount * (h.avgPrice || p);
        });
        setTotalValue(val);
        setTotalCost(cost);
    }, [prices, holdings]);

    const addAsset = () => {
        if (!newAmount || isNaN(newAmount)) return;
        const exists = holdings.find(h => h.symbol === newCoin);
        if (exists) {
            const updated = holdings.map(h => h.symbol === newCoin ? { ...h, amount: parseFloat(h.amount) + parseFloat(newAmount) } : h);
            setHoldings(updated);
        } else {
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
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 transition-all duration-300">
            {/* Header with Institutional Gradient Background */}
            <div className="bg-gradient-to-r from-primary/5 to-base rounded-2xl p-6 shadow-soft border border-border">
                <header className="flex justify-between items-center">
                    <div>
                        <h2 className={UI_CONFIG.typography.pageTitle}>Portfolio Simulator</h2>
                        <p className={`${UI_CONFIG.typography.subLabel} mt-1`}>Track your crypto holdings (Stored locally)</p>
                    </div>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        variant="primary"
                        icon={Plus}
                        className="shadow-lg hover:scale-105"
                    >
                        Add Asset
                    </Button>
                </header>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-full min-h-[110px] p-5 rounded-2xl border border-border bg-surface card-luxury flex flex-col justify-between hover:translate-y-[-2px] hover:border-border-strong transition-all duration-300 ease-out">
                    <h3 className={UI_CONFIG.typography.cardTitle}>Total Balance</h3>
                    <div className={UI_CONFIG.typography.cardValue}>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="h-full min-h-[110px] p-5 rounded-2xl border border-border bg-surface card-luxury flex flex-col justify-between hover:translate-y-[-2px] hover:border-border-strong transition-all duration-300 ease-out">
                    <h3 className={UI_CONFIG.typography.cardTitle}>Total Profit/Loss</h3>
                    <div className={`${UI_CONFIG.typography.cardValue} flex items-center gap-2 ${totalPnL >= 0 ? "text-success" : "text-error"}`}>
                        {totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className={`text-sm px-2 py-1 rounded-full ${totalPnLPct >= 0 ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                            {totalPnLPct.toFixed(2)}%
                        </span>
                    </div>
                </div>
                <div className="h-full min-h-[110px] p-5 rounded-2xl border border-border bg-surface card-luxury flex flex-col justify-between hover:translate-y-[-2px] hover:border-border-strong transition-all duration-300 ease-out items-center justify-center">
                    <div className="text-center text-ink-dim opacity-50">
                        <PieChart className="w-10 h-10 mx-auto mb-2" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Allocation Chart</span>
                    </div>
                </div>
            </div>

            {/* Assets List */}
            <div className={UI_CONFIG.card.section + " p-0 overflow-hidden"}>
                {holdings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-ink-dim">
                        <Wallet className="w-16 h-16 mb-4 opacity-20 animate-float" />
                        <h3 className="text-xl font-semibold text-ink mb-2">No Assets Yet</h3>
                        <p className={UI_CONFIG.typography.subLabel}>
                            Click "Add Asset" to start tracking your portfolio
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-base text-ink-dim font-bold border-b border-border">
                            <tr>
                                <th className="p-4 uppercase tracking-wider text-[10px]">Asset</th>
                                <th className="p-4 uppercase tracking-wider text-[10px]">Price</th>
                                <th className="p-4 uppercase tracking-wider text-[10px]">Balance</th>
                                <th className="p-4 uppercase tracking-wider text-[10px]">Value</th>
                                <th className="p-4 uppercase tracking-wider text-[10px]">24h Change</th>
                                <th className="p-4 text-right uppercase tracking-wider text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {holdings.map((h) => {
                                const p = prices[h.symbol];
                                const currentPrice = p?.price || 0;
                                const val = h.amount * currentPrice;
                                return (
                                    <tr key={h.symbol} className="hover:bg-white/[0.03] transition-colors group">
                                        <td className="p-4 font-bold text-ink uppercase">{h.symbol}</td>
                                        <td className="p-4 text-ink-dim">${currentPrice.toLocaleString()}</td>
                                        <td className="p-4 text-ink-dim">{h.amount}</td>
                                        <td className="p-4 font-medium text-ink">${val.toLocaleString()}</td>
                                        <td className="p-4">
                                            {p?.change_24h ? (
                                                <span className={`flex items-center gap-1 font-bold ${p.change_24h >= 0 ? "text-success" : "text-error"}`}>
                                                    {p.change_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {Math.abs(p.change_24h).toFixed(2)}%
                                                </span>
                                            ) : <span className="text-ink-dim/30">--</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => removeAsset(h.symbol)} className="text-ink-dim hover:text-error transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
                        <h3 className="font-bold text-lg mb-4 dark:text-slate-100">Add Asset</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Symbol (e.g. bitcoin)</label>
                                <input
                                    className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2 outline-none focus:border-primary dark:bg-slate-700 dark:text-slate-100"
                                    value={newCoin}
                                    onChange={e => setNewCoin(e.target.value.toLowerCase())}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Amount</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2 outline-none focus:border-primary dark:bg-slate-700 dark:text-slate-100"
                                    value={newAmount}
                                    onChange={e => setNewAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Avg Buy Price (Optional)</label>
                                <input
                                    type="number"
                                    placeholder="Leave empty for current price"
                                    className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2 outline-none focus:border-primary dark:bg-slate-700 dark:text-slate-100"
                                    value={newAvgPrice}
                                    onChange={e => setNewAvgPrice(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="flex-1">Cancel</Button>
                            <Button onClick={addAsset} variant="primary" className="flex-1">Add</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolio;
