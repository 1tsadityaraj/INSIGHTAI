import React, { useState, useRef, useEffect } from "react";
import Message from "../components/Message";
import ChatInput from "../components/ChatInput";
import KPICard from "../components/KPICard";
import MarketChart from "../components/MarketChart";
import { api } from "../services/api";
import FloatingStatusBubble from "../components/FloatingStatusBubble";
import FloatingActionButton from "../components/FloatingActionButton";
import { market } from "../services/market"; // Import market service
import { Sparkles, TrendingUp, DollarSign, Activity, Star } from "lucide-react";

const Dashboard = () => {
    console.log("Dashboard.jsx: Rendering...");
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [marketData, setMarketData] = useState({
        type: "market",
        kpi: null,
        chart: null,
        content: null,
        insights: [],
        concept_kpis: [],
        social_sentiment: null,
        news_headlines: [],
        source_url: null,
        research_plan: [], // New check
        deep_dive: [],     // New check
        loading: true,
        error: null
    });
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
    }, []);

    const fetchMarketData = async (coinId, selectedRange = "30") => {
        setMarketData(prev => ({ ...prev, loading: true, error: null }));
        try {
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
    };

    const handleRangeChange = (newRange) => {
        setRange(newRange);
        // If viewing single market asset, refresh data
        if (marketData.type === 'market' && marketData.kpi?.name) {
            // Use symbol or name. Currently using 'bitcoin' default but should track current asset ID.
            // Ideally API returns asset ID. Assuming kpi.id or we track it.
            // For now, let's just trigger a refresh if we know the asset. 
            // We'll need to store currentAssetId in state to be precise.
            // Attempting to infer from KPI name/symbol might be flaky if we don't have ID.
            // We'll update state to track `activeAssetId`.
            fetchMarketData(activeAssetId, newRange);
        }
        // Comparison/Forex range updates would ideally go here too, but start with single asset.
    };

    // Track active single asset ID for range toggling
    const [activeAssetId, setActiveAssetId] = useState("bitcoin");

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

    const handleSend = async (query) => {
        // 1. Add User Message
        const userMsg = { role: "user", content: query };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // 2. Add Temporary AI Loading Message
            setMessages((prev) => [...prev, { role: "ai", content: null, isLoading: true }]);

            // 3. API Call
            const data = await api.sendQuery(query);

            // 4. Update AI Message with Data
            setMessages((prev) => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = {
                    role: "ai",
                    content: data,
                    isLoading: false
                };
                return newHistory;
            });

            // 5. Dynamic Dashboard Update
            if (data.type === "market" && data.asset) {
                console.log(`API: Market intent detected for ${data.asset}. Updating dashboard...`);
                setActiveAssetId(data.asset);
                fetchMarketData(data.asset, range); // Use current range
                setMarketData(prev => ({
                    ...prev,
                    type: "market",
                    content: data.content,
                    insights: data.insights || [],
                    research_plan: data.research_plan || [],
                    social_sentiment: data.social_sentiment,
                    news_headlines: data.news_headlines || []
                }));
            } else if (data.type === "comparison") {
                setMarketData({
                    type: "comparison",
                    loading: false,
                    content: data.content,
                    comparison_assets: data.comparison_assets,
                    error: null
                });
            } else if (data.type === "forex") {
                setMarketData({
                    type: "forex",
                    loading: false,
                    content: data.content,
                    forex_data: data.forex_data,
                    error: null
                });
            } else if (data.type === "concept") {
                console.log("API: Concept intent detected. Resetting analytics view.");
                setMarketData({
                    type: "concept",
                    kpi: null,
                    chart: null,
                    content: data.content,
                    insights: data.insights || [],
                    concept_kpis: data.concept_kpis || [],
                    research_plan: data.research_plan || [],
                    deep_dive: data.deep_dive || [],
                    social_sentiment: data.social_sentiment,
                    news_headlines: data.news_headlines || [],
                    source_url: data.source_url,
                    loading: false,
                    error: null
                });
            }

        } catch (error) {
            setMessages((prev) => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = {
                    role: "ai",
                    content: "Sorry, I encountered an error while analyzing your request. Please try again.",
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
        <div className="flex h-screen bg-gray-50 overflow-hidden" data-testid="dashboard-root">
            {/* Left Panel: Analytics (65%) */}
            <div className="w-[65%] flex flex-col p-6 space-y-6 overflow-y-auto">
                <header className="flex flex-col gap-2 mb-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-2xl">
                        <Sparkles className="w-8 h-8" />
                        <span>InsightAI Analytics</span>
                    </div>
                    {/* Watchlist Chips */}
                    {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Watchlist:</span>
                            {watchlist.map((asset) => (
                                <button
                                    key={asset}
                                    onClick={() => {
                                        setActiveAssetId(asset);
                                        fetchMarketData(asset, range);
                                    }}
                                    className={`text-xs px-2 py-1 rounded-md border transition-all ${activeAssetId === asset ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'}`}
                                >
                                    {asset}
                                </button>
                            ))}
                        </div>
                    )}
                </header>

                {/* KPI Cards Logic (Enhanced for Comparison/Forex) */}
                {marketData.type === 'concept' && marketData.concept_kpis?.length > 0 ? (
                    <div className={`grid gap-4 ${marketData.concept_kpis.length > 3 ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-3'}`}>
                        {marketData.concept_kpis.map((ck, i) => (
                            <KPICard key={i} label={ck.label} value={ck.value} icon={i === 0 ? Activity : i === 1 ? TrendingUp : Sparkles} />
                        ))}
                    </div>
                ) : marketData.type === 'comparison' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {marketData.comparison_assets?.map((asset, i) => (
                            <KPICard
                                key={i}
                                label={asset.name}
                                value={`$${asset.current_price?.toLocaleString()}`}
                                subValue={`MCap: $${(asset.market_cap / 1e9).toFixed(1)}B`}
                                icon={DollarSign}
                            />
                        ))}
                    </div>
                ) : marketData.type === 'forex' ? (
                    <div className="grid grid-cols-2 gap-4">
                        <KPICard label="Exchange Rate" value={marketData.forex_data?.rate?.rate} icon={DollarSign} />
                        <KPICard label="Pair" value={`${marketData.forex_data?.rate?.base}/${marketData.forex_data?.rate?.target}`} icon={Activity} />
                    </div>
                ) : kpi ? (
                    <div className="grid grid-cols-3 gap-4">
                        <KPICard
                            label="Current Price"
                            value={loading ? "..." : `$${kpi?.current_price_usd?.toLocaleString() || 0}`}
                            subValue={loading ? "" : `${kpi?.price_change_percentage_24h?.toFixed(2)}% (24h)`}
                            trend={kpi?.price_change_percentage_24h >= 0 ? 'up' : 'down'}
                            icon={DollarSign}
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
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-full min-h-[100px] flex items-center justify-center text-gray-300">--</div>)}
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-grow bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ minHeight: '400px', minWidth: 0 }}>

                    {/* Toolbar / Controls */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-700">
                                {marketData.type === 'market' ? `${kpi?.name || 'Asset'} Performance` :
                                    marketData.type === 'comparison' ? 'Market Comparison' :
                                        marketData.type === 'forex' ? 'Forex Rate History' : 'Analysis View'}
                            </h3>
                            {/* Watchlist Star Button */}
                            {marketData.type === 'market' && (
                                <button
                                    onClick={handleToggleWatchlist}
                                    title={watchlist.includes(activeAssetId) ? "Remove from Watchlist" : "Add to Watchlist"}
                                    className="hover:scale-110 transition-transform"
                                >
                                    <Star
                                        className={`w-5 h-5 ${watchlist.includes(activeAssetId) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                                    />
                                </button>
                            )}
                        </div>

                        {/* Range Selector */}
                        {(marketData.type === 'market' || marketData.type === 'forex') && (
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {["7", "30", "90", "365"].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => handleRangeChange(d)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${range === d ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {d}D
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex-grow p-12 space-y-6 animate-pulse">
                            <div className="h-4 bg-gray-50 rounded w-full"></div>
                        </div>
                    ) : error ? (
                        <div className="flex-grow flex items-center justify-center text-red-500">{error}</div>
                    ) : marketData.type === "comparison" ? (
                        // Comparison Chart (Simplified Placeholder for now, ideally passes multi-line data to MarketChart)
                        <div className="flex-grow p-4">
                            <MarketChart
                                data={marketData.comparison_assets?.[0]?.chart_data}
                                coinName={marketData.comparison_assets?.[0]?.name}
                                days={30}
                                comparisonData={marketData.comparison_assets?.slice(1)} // Pass others as extra data
                            />
                        </div>
                    ) : marketData.type === "forex" ? (
                        <div className="flex-grow relative h-full">
                            <MarketChart
                                data={marketData.forex_data?.chart}
                                coinName={`${marketData.forex_data?.rate?.base}/${marketData.forex_data?.rate?.target}`}
                                days={Number(range)}
                            />
                        </div>
                    ) : marketData.type === "concept" ? (
                        <div className="flex-grow p-10 overflow-y-auto">
                            {/* ... Concept Render Logic (Keep Existing) ... */}
                            <div className="max-w-4xl mx-auto">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <Sparkles className="text-primary w-7 h-7" /> Conceptual Overview
                                </h2>
                                {/* Research Plan */}
                                {marketData.research_plan?.length > 0 && (
                                    <div className="mb-8 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Research Methodology</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {marketData.research_plan.map((task, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-blue-100 text-xs text-blue-700 shadow-sm">
                                                    ✓ {task.description}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed text-lg mb-10">{marketData.content}</div>

                                {/* Deep Dive */}
                                {marketData.deep_dive?.length > 0 && (
                                    <div className="mt-10 space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Technical Deep-Dive</h3>
                                        <div className="space-y-4">
                                            {marketData.deep_dive.map((section, idx) => (
                                                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                                                    <details className="group">
                                                        <summary className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100">
                                                            <div className="font-semibold text-gray-700">{section.title}</div>
                                                            <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                                                        </summary>
                                                        <div className="p-6 bg-white prose prose-sm text-gray-600 border-t border-gray-200">{section.content}</div>
                                                    </details>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : chart && kpi ? (
                        <div className="flex-grow relative" style={{ width: '100%', height: '100%', minHeight: '350px' }}>
                            <MarketChart
                                data={chart}
                                coinName={kpi?.name || "Crypto"}
                                days={Number(range)}
                            />
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 space-y-2">
                            <Activity className="w-10 h-10 opacity-20" />
                            <p>No asset selected</p>
                        </div>
                    )}
                </div>

                {/* Secondary Data: Social Sentiment & News */}
                {(marketData.social_sentiment || marketData.news_headlines?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Sentiment Pulse */}
                        {marketData.social_sentiment && (
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Social Pulse (X/Reddit)
                                </h3>
                                <div className="flex items-end gap-4">
                                    <div className="text-3xl font-bold text-gray-900">{marketData.social_sentiment.status}</div>
                                    <div className={`text-sm font-semibold px-2 py-0.5 rounded ${marketData.social_sentiment.score > 0.6 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {Math.round(marketData.social_sentiment.score * 100)}% Bullish
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Analyzed from {marketData.social_sentiment.volume_24h.toLocaleString()} global mentions</p>
                            </div>
                        )}

                        {/* News Headlines */}
                        {marketData.news_headlines?.length > 0 && (
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Recent Global Context
                                </h3>
                                <div className="space-y-3">
                                    {marketData.news_headlines.slice(0, 3).map((news, i) => (
                                        <div key={i} className="text-sm text-gray-700 border-l-2 border-primary/20 pl-3 py-1">
                                            {news.title || news.snippet}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right Panel: Chat (35%) */}
            <div className="w-[35%] bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-semibold text-gray-700">AI Assistant</h2>
                    <p className="text-xs text-gray-400">Ask about market trends & analysis</p>
                </div>

                <div className="flex-grow overflow-y-auto scroll-smooth p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                            <Sparkles className="w-12 h-12 text-primary" />
                            <p className="text-sm">Ask "Show me Ethereum chart" or "Analyze Bitcoin trends"</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <Message key={idx} message={msg} />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-gray-100">
                    <ChatInput onSend={handleSend} isLoading={isLoading} />
                </div>
            </div>

            <FloatingStatusBubble isProcessing={isLoading} />
            <FloatingActionButton onInsightRequest={() => handleSend("Summarize the current market data and provide key insights.")} />
        </div >
    );
};

export default Dashboard;
