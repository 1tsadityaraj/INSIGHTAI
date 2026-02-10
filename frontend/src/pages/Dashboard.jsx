import React, { useState, useRef, useEffect } from "react";
import Message from "../components/Message";
import ChatInput from "../components/ChatInput";
import KPICard from "../components/KPICard";
import MarketChart from "../components/MarketChart";
import { api } from "../services/api";
import { market } from "../services/market"; // Import market service
import { Sparkles, TrendingUp, DollarSign, Activity } from "lucide-react";

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

    // Initial Data Fetch (Bitcoin Default)
    useEffect(() => {
        fetchMarketData("bitcoin");
    }, []);

    const fetchMarketData = async (coinId) => {
        setMarketData(prev => ({ ...prev, loading: true, error: null }));

        try {
            const data = await market.fetchMarketData(coinId, 30);

            // 🔒 STRICT SCHEMA HANDLING
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
            console.error("Dashboard Fetch Error:", err);
            setMarketData({
                kpi: null,
                chart: null,
                loading: false,
                error: "Failed to load market data."
            });
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
                fetchMarketData(data.asset);
                setMarketData(prev => ({
                    ...prev,
                    type: "market",
                    content: data.content,
                    insights: data.insights || [],
                    social_sentiment: data.social_sentiment,
                    news_headlines: data.news_headlines || []
                }));
            } else if (data.type === "concept") {
                console.log("API: Concept intent detected. Resetting analytics view.");
                setMarketData({
                    type: "concept",
                    kpi: null,
                    chart: null,
                    content: data.content,
                    insights: data.insights || [],
                    concept_kpis: data.concept_kpis || [],
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
                <header className="flex items-center gap-2 text-primary font-bold text-2xl mb-2">
                    <Sparkles className="w-8 h-8" />
                    <span>InsightAI Analytics</span>
                </header>

                {/* KPI Cards */}
                {marketData.type === 'concept' && marketData.concept_kpis?.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                        {marketData.concept_kpis.map((ck, i) => (
                            <KPICard
                                key={i}
                                label={ck.label}
                                value={ck.value}
                                icon={i === 0 ? Activity : i === 1 ? TrendingUp : Sparkles}
                            />
                        ))}
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
                        {/* Empty State Placeholders */}
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-full min-h-[100px] flex items-center justify-center text-gray-300">
                                --
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Content Area: Chart or Concept Info */}
                <div
                    className="flex-grow bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
                    style={{ minHeight: '400px', minWidth: 0 }}
                >
                    {loading ? (
                        <div className="flex-grow p-12 space-y-6 animate-pulse">
                            <div className="h-8 bg-gray-100 rounded w-1/3"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-50 rounded w-full"></div>
                                <div className="h-4 bg-gray-50 rounded w-full"></div>
                                <div className="h-4 bg-gray-50 rounded w-4/5"></div>
                            </div>
                            <div className="mt-10 grid grid-cols-3 gap-6">
                                <div className="h-24 bg-gray-50 rounded-lg"></div>
                                <div className="h-24 bg-gray-50 rounded-lg"></div>
                                <div className="h-24 bg-gray-50 rounded-lg"></div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex-grow flex items-center justify-center text-red-500">{error}</div>
                    ) : marketData.type === "concept" ? (
                        <div className="flex-grow p-10 overflow-y-auto">
                            <div className="max-w-4xl mx-auto">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <Sparkles className="text-primary w-7 h-7" />
                                    Conceptual Overview
                                </h2>
                                <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed text-lg mb-10">
                                    {marketData.content}
                                </div>

                                {marketData.insights && marketData.insights.length > 0 && (
                                    <div className="mt-12 space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Analysis Matrix</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {marketData.insights.map((insight, i) => (
                                                <div key={i} className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 p-6 rounded-xl text-sm text-gray-700 shadow-sm">
                                                    {insight}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {marketData.source_url && (
                                    <div className="mt-12 pt-8 border-t border-gray-100">
                                        <a
                                            href={marketData.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                                        >
                                            View full article on Wikipedia →
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : chart && kpi ? (
                        <div className="flex-grow relative" style={{ width: '100%', height: '100%', minHeight: '350px' }}>
                            <MarketChart
                                data={chart}
                                coinName={kpi?.name || "Crypto"}
                                days={30}
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
        </div>
    );
};

export default Dashboard;
