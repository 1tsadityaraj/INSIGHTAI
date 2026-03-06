import React, { useCallback, useEffect, useRef, useState } from "react";
import Message from "../components/Message";
import ChatInput from "../components/ChatInput";
import KPICard from "../components/KPICard";
import MarketChart from "../components/MarketChart";
import MACDChart from "../components/MACDChart"; // New
import MarketHealthPanel from "../components/MarketHealthPanel"; // New (Replaces MarketScore)
import HeatmapGrid from "../components/HeatmapGrid";
import PriceAlerts from "../components/PriceAlerts";
import Portfolio from "../components/Portfolio"; // New
import ThemeToggle from "../components/ThemeToggle"; // Dark Mode Toggle
import { api } from "../services/api";
import FloatingStatusBubble from "../components/FloatingStatusBubble";
import FloatingActionButton from "../components/FloatingActionButton";
import { market } from "../services/market";
import { Sparkles, TrendingUp, DollarSign, Activity, Star, BarChart2, Zap, LayoutDashboard, PieChart, AlertTriangle } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import useCryptoWebSocket from "../hooks/useCryptoWebSocket"; // New Hook
import { useTheme } from "../context/themeContext";

const Dashboard = () => {
    const { theme } = useTheme();
    // console.log("Dashboard.jsx: Rendering...");
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("analytics"); // analytics | portfolio

    const [marketData, setMarketData] = useState({
        type: "market",
        kpi: null,
        chart: null,
        market_score: null,
        content: null,
        insights: [],
        loading: true,
        error: null,
        explanation: null
    });

    // Comparison State
    const [comparisonMode, setComparisonMode] = useState(false);
    const [compareAssets, setCompareAssets] = useState([]);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Range Selector State
    const [range, setRange] = useState("30");

    // Watchlist State
    const [watchlist, setWatchlist] = useState([]);

    // Track active single asset ID for range toggling
    const [activeAssetId, setActiveAssetId] = useState("bitcoin");

    // WebSocket Integration
    const { priceData } = useCryptoWebSocket(activeAssetId);

    const fetchMarketData = useCallback(async (coinId, selectedRange = "30") => {
        setMarketData(prev => ({ ...prev, loading: true, error: null, explanation: null }));
        try {
            // Check Comparison Mode
            if (comparisonMode && compareAssets.length > 0) {
                const symbols = [coinId, ...compareAssets];
                const data = await market.fetchComparison(symbols, selectedRange);
                setMarketData(prev => ({
                    ...prev,
                    type: "comparison",
                    chart: { values: [], labels: [] }, // Dummy for chart validation
                    comparison_data: data.datasets, // New field for normalized data
                    loading: false,
                    error: null
                }));
                return;
            }

            const data = await market.fetchMarketData(coinId, selectedRange);
            if (data.chart_error) {
                console.warn("Chart unavailable:", data.message);
                setMarketData(prev => ({
                    ...prev,
                    kpi: data.kpi,
                    chart: null,
                    loading: false,
                    error: data.message || "Market data unavailable"
                }));
                return;
            }
            setMarketData(prev => ({
                ...prev,
                type: "market",
                kpi: data.kpi,
                chart: data.chart_data,
                market_score: data.market_score,
                loading: false,
                error: null
            }));
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log("Fetch aborted");
                return;
            }
            console.error("Dashboard Fetch Error:", err);
            setMarketData({ kpi: null, chart: null, loading: false, error: "Failed to load market data." });
        }
    }, [compareAssets, comparisonMode]);

    // Update KPI with real-time data
    useEffect(() => {
        if (!priceData || comparisonMode) return;
        setMarketData(prev => {
            if (!prev.kpi) return prev;
            return {
                ...prev,
                kpi: {
                    ...prev.kpi,
                    current_price_usd: priceData.price,
                    price_change_percentage_24h: priceData.change_24h
                }
            };
        });
    }, [priceData, comparisonMode]);

    // Initial Data Fetch (Bitcoin Default)
    useEffect(() => {
        let active = true;

        const loadInitialData = async () => {
            if (active) await fetchMarketData("bitcoin", "30");
            if (active) {
                api.getWatchlist().then(w => {
                    if (active) setWatchlist(w);
                }).catch(e => console.warn("Watchlist fetch failed", e));
            }
        };

        loadInitialData();

        return () => { active = false; };
    }, [fetchMarketData]);

    const handleRangeChange = (newRange) => {
        setRange(newRange);
        fetchMarketData(activeAssetId, newRange);
    };

    const handleToggleWatchlist = async () => {
        if (!activeAssetId) return;
        try {
            let newW;
            if (watchlist.includes(activeAssetId)) {
                newW = await api.removeFromWatchlist(activeAssetId);
            } else {
                newW = await api.addToWatchlist(activeAssetId);
            }
            setWatchlist(newW);
        } catch (e) {
            console.error("Watchlist toggle failed", e);
        }
    };

    const handleExplainChart = async () => {
        if (!activeAssetId) return;
        try {
            // Show ephemeral loading state or toast
            toast.info("Analyzing chart patterns...");
            const data = await market.fetchExplanation(activeAssetId, range);
            setMarketData(prev => ({ ...prev, explanation: data.explanation }));
            // Add detailed response to chat
            setMessages(prev => [...prev, {
                role: "ai",
                content: `Chart Analysis for ${activeAssetId.toUpperCase()}:\n\n${data.explanation}`,
                isLoading: false
            }]);
        } catch (e) {
            console.error("Explain failed", e);
            toast.error("Failed to generate explanation.");
        }
    };

    const toggleComparisonMode = () => {
        if (comparisonMode) {
            setComparisonMode(false);
            setCompareAssets([]);
            fetchMarketData(activeAssetId, range);
        } else {
            setComparisonMode(true);
            const target = activeAssetId === 'bitcoin' ? 'ethereum' : 'bitcoin';
            setCompareAssets([target]);

            market.fetchComparison([activeAssetId, target], range).then(data => {
                setMarketData(prev => ({
                    ...prev,
                    type: "comparison",
                    chart: { values: [], labels: [] },
                    comparison_data: data.datasets,
                    loading: false
                }));
            });
        }
    };

    const handleSend = async (query) => {
        // ... (Keep existing chat logic)
        // For brevity, using simplified version
        const userMsg = { role: "user", content: query };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            setMessages((prev) => [...prev, { role: "ai", content: null, isLoading: true }]);
            const data = await api.sendQuery(query);

            setMessages((prev) => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = {
                    role: "ai",
                    content: data.explanation || data.content || "Here is the result.",
                    isLoading: false
                };
                return newHistory;
            });

            if (data.asset) {
                // If asset detected, switch view
                setActiveAssetId(data.asset);
                fetchMarketData(data.asset, range);
            }

        } catch (error) {
            console.error("Chat send failed:", error);
            setMessages((prev) => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = {
                    role: "ai",
                    content: "Error analyzing request.",
                    isLoading: false
                };
                return newHistory;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const { kpi, chart, loading, error } = marketData;

    return (
        <div className="ui-shell overflow-hidden animate-premium-fade" data-testid="dashboard-root">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme={theme} />

            <div className="ui-container py-6">
                <div className="flex flex-col lg:flex-row gap-6 h-[calc(100dvh-3rem)]">
                    {/* Left Panel */}
                    <div className="lg:w-[65%] flex flex-col space-y-6 overflow-y-auto scroll-smooth pr-1 ui-animate-in pb-10">
                        <header className="flex flex-col gap-2 mb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary font-bold text-2xl">
                                    <Sparkles className="w-8 h-8" />
                                    <span>InsightAI Analytics</span>
                                </div>

                                {/* Theme Toggle & Tab Switcher */}
                                <div className="flex items-center gap-3">
                                    <ThemeToggle />

                                    {/* Tab Switcher */}
                                    <div className="flex bg-border p-1 rounded-xl shadow-inner" role="tablist" aria-label="Dashboard view">
                                        <button
                                            onClick={() => setActiveTab("analytics")}
                                            role="tab"
                                            aria-selected={activeTab === 'analytics'}
                                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${activeTab === 'analytics' ? 'bg-surface text-primary shadow-sm ring-1 ring-border' : 'text-ink-muted hover:text-ink'}`}
                                        >
                                            <LayoutDashboard className="w-3.5 h-3.5" /> Market
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("portfolio")}
                                            role="tab"
                                            aria-selected={activeTab === 'portfolio'}
                                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${activeTab === 'portfolio' ? 'bg-surface text-primary shadow-sm ring-1 ring-border' : 'text-ink-muted hover:text-ink'}`}
                                        >
                                            <PieChart className="w-4 h-4" /> Portfolio
                                        </button>
                                    </div>
                                </div>

                                {/* Price Alerts Widget - Only show in analytics */}
                                {activeTab === 'analytics' && marketData.type === 'market' && kpi && (
                                    <PriceAlerts currentPrice={kpi.current_price_usd} symbol={activeAssetId} />
                                )}
                            </div>

                            {/* Watchlist Chips */}
                            {activeTab === 'analytics' && watchlist.length > 0 && (
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-xs font-bold text-ink-muted uppercase tracking-widest">Watchlist:</span>
                                    {watchlist.map((asset) => (
                                        <button
                                            key={asset}
                                            onClick={() => {
                                                setActiveAssetId(asset);
                                                fetchMarketData(asset, range);
                                            }}
                                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${activeAssetId === asset ? 'bg-primary text-white border-primary shadow-[0_2px_10px_rgba(59,130,246,0.28)]' : 'bg-surface text-ink-dim border-border hover:border-primary/40 hover:bg-primary/5'}`}
                                        >
                                            {asset}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </header>

                        {activeTab === 'portfolio' ? (
                            <Portfolio active={true} />
                        ) : (
                            <>
                                {/* KPI Grid */}
                                {marketData.type === 'market' && kpi ? (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ui-animate-in">
                                        <KPICard
                                            label="Current Price"
                                            value={loading ? "..." : `$${kpi?.current_price_usd?.toLocaleString() || 0}`}
                                            subValue={loading ? "" : `${kpi?.price_change_percentage_24h?.toFixed(2)}% (24h)`}
                                            trend={kpi?.price_change_percentage_24h >= 0 ? 'up' : 'down'}
                                            icon={DollarSign}
                                            glow={!!priceData} // Add glow effect on update if supported
                                        />
                                        <KPICard
                                            label="Market Cap"
                                            value={loading ? "..." : `$${(kpi?.market_cap_usd / 1e9)?.toFixed(2)}B`}
                                            icon={Activity}
                                        />
                                        <KPICard
                                            label="24h High"
                                            value={loading ? "..." : `$${kpi?.high_24h?.toLocaleString() || 0}`}
                                            subValue={loading ? "" : `Low: $${kpi?.low_24h?.toLocaleString()}`}
                                            icon={TrendingUp}
                                        />
                                        {/* Market Health Panel (Replaces Score) */}
                                        <div className="h-full">
                                            <MarketHealthPanel scoreData={marketData.market_score} />
                                        </div>
                                    </div>
                                ) : null}

                                {/* Main Content Area */}
                                <div className="flex flex-col space-y-4 shrink-0">
                                    <div className="ui-panel-elevated overflow-hidden flex flex-col min-h-[500px] shrink-0 ui-animate-in">

                                        {/* Toolbar / Controls */}
                                        <div className="p-4 border-b border-border flex justify-between items-center bg-base/50 backdrop-blur-sm">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-ink flex items-center gap-2 uppercase tracking-tight">
                                                    {marketData.type === 'comparison' ? 'Performance Comparison' : `${kpi?.name || 'Asset'} Performance`}
                                                    {marketData.type === 'market' && (
                                                        <button
                                                            onClick={handleExplainChart}
                                                            className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-primary/20 transition-colors font-bold uppercase tracking-wider"
                                                        >
                                                            <Zap className="w-2.5 h-2.5" /> AI Explain
                                                        </button>
                                                    )}
                                                </h3>
                                                {/* Watchlist Star Button */}
                                                {marketData.type === 'market' && (
                                                    <button
                                                        onClick={handleToggleWatchlist}
                                                        title={watchlist.includes(activeAssetId) ? "Remove from Watchlist" : "Add to Watchlist"}
                                                        className="hover:scale-110 transition-transform"
                                                    >
                                                        <Star
                                                            className={`w-5 h-5 ${watchlist.includes(activeAssetId) ? 'fill-warning text-warning' : 'text-ink-muted hover:text-warning'}`}
                                                        />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {/* Comparison Toggle */}
                                                <button
                                                    onClick={toggleComparisonMode}
                                                    className={`text-xs px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1 transition-all ${comparisonMode ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface text-ink-dim border-border hover:border-primary/50'}`}
                                                >
                                                    <BarChart2 className="w-3 h-3" />
                                                    {comparisonMode ? 'Exit Compare' : 'Compare'}
                                                </button>

                                                {/* Range Selector */}
                                                <div className="flex bg-border/50 p-1 rounded-lg">
                                                    {["7", "30", "90", "365"].map((d) => (
                                                        <button
                                                            key={d}
                                                            onClick={() => handleRangeChange(d)}
                                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${range === d ? 'bg-surface text-primary shadow-sm' : 'text-ink-dim hover:text-ink'}`}
                                                        >
                                                            {d}D
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {loading ? (
                                            <div className="flex-grow p-12 space-y-6 animate-pulse">
                                                <div className="h-4 bg-border rounded w-full"></div>
                                                <div className="flex-grow bg-border/50 rounded-xl"></div>
                                            </div>
                                        ) : error ? (
                                            <div className="flex-grow flex items-center justify-center p-10">
                                                <div className="w-full max-w-md ui-panel p-6 ui-animate-pop">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-error/10 text-error border border-error/15">
                                                            <AlertTriangle className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold text-ink">Market data unavailable</div>
                                                            <div className="text-sm text-ink-dim mt-1 leading-relaxed">{error}</div>
                                                            <button
                                                                onClick={() => fetchMarketData(activeAssetId, range)}
                                                                className="mt-4 inline-flex items-center rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink-dim hover:text-ink hover:border-border-strong transition-colors"
                                                            >
                                                                Retry
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-grow relative h-full w-full">
                                                {/* Explanation Overlay */}
                                                {marketData.explanation && (
                                                    <div className="absolute top-4 left-4 right-4 z-10 ui-popover p-4 animate-in fade-in slide-in-from-top-2 border-primary/20">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex gap-3">
                                                                <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                                                                <div>
                                                                    <h4 className="font-bold text-ink text-sm uppercase tracking-tight">AI Protocol Analysis</h4>
                                                                    <p className="text-sm text-ink-dim leading-relaxed">{marketData.explanation}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setMarketData(prev => ({ ...prev, explanation: null }))}
                                                                className="text-ink-muted hover:text-ink transition-colors"
                                                            >
                                                                <span className="sr-only">Close</span>×
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <MarketChart
                                                    data={comparisonMode ? {
                                                        values: marketData.comparison_data?.[0]?.values || [],
                                                        labels: marketData.comparison_data?.[0]?.labels || [],
                                                        sma: [], ema: [], rsi: []
                                                    } : chart}
                                                    coinName={comparisonMode ? (marketData.comparison_data?.[0]?.name || "Comparison") : (kpi?.name || "Asset")}
                                                    days={Number(range)}
                                                    comparisonData={comparisonMode ? marketData.comparison_data?.slice(1) : []}
                                                    isPercentage={comparisonMode}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* MACD Chart (Only if not in comparison mode and data exists) */}
                                    {!loading && !comparisonMode && chart?.macd && (
                                        <MACDChart data={chart} days={Number(range)} />
                                    )}
                                </div>

                                {/* Heatmap Section */}
                                <HeatmapGrid />
                            </>
                        )}

                    </div>

                    {/* Right Panel: Chat (Institutional Sidebar) */}
                    {/* Right Panel */}
                    <div className="relative lg:w-[35%] ui-panel-elevated overflow-hidden flex flex-col min-h-[520px] lg:min-h-0 ui-animate-in">
                        {/* AI Grid Overlay */}
                        <div className="absolute inset-0 bg-ai-grid opacity-20 pointer-events-none"></div>

                        <div className="relative p-5 border-b border-border bg-gradient-to-b from-surface to-surface/40 backdrop-blur">
                            <h2 className="font-bold text-ink uppercase tracking-tight text-xs">AI Analysis Protocol</h2>
                            <p className="text-[10px] text-ink-muted uppercase tracking-[0.12em] font-bold opacity-70">Deep Scanning Systems Active</p>
                        </div>

                        <div className="flex-grow overflow-y-auto scroll-smooth px-4 py-5 space-y-3 min-h-0 bg-gradient-to-b from-chat-from/70 via-chat-from/40 to-chat-to/70">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                                    <Sparkles className="w-12 h-12 text-primary" />
                                    <p className="text-sm text-ink-dim font-normal">Ask "Show me Ethereum chart" or "Analyze Bitcoin trends"</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <Message key={idx} message={msg} />
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-gradient-to-b from-surface/60 to-surface backdrop-blur border-t border-border">
                            <ChatInput onSend={handleSend} isLoading={isLoading} onDemoClick={(id) => {
                                setActiveAssetId(id);
                                fetchMarketData(id, range);
                            }} />
                        </div>
                    </div>

                    <FloatingStatusBubble isProcessing={isLoading} />
                    <FloatingActionButton onInsightRequest={() => handleSend("Summarize the current market data and provide key insights.")} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
