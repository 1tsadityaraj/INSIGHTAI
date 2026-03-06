import React from "react";
import { Bot, User } from "lucide-react";
import InsightList from "./InsightList";
import ChartView from "./ChartView";

/**
 * Message Component
 * Renders a chat bubble for either the user or the AI.
 * @param {Object} message - { role: 'user' | 'ai', content: string | Object, isLoading: boolean }
 */
const Message = ({ message }) => {
    const isUser = message.role === "user";

    return (
        <div className={`flex w-full ${isUser ? "justify-end ui-animate-right" : "justify-start ui-animate-left"}`}>
            <div className={`flex items-start gap-3 max-w-[92%] ${isUser ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isUser ? "bg-surface-elevated border-border text-ink" : "bg-primary border-primary text-white"}`}>
                        {isUser ? <User className="w-5 h-5 text-ink-dim" /> : <Bot className="w-5 h-5 text-white" />}
                    </div>
                </div>

                {/* Bubble */}
                <div
                    className={`min-w-0 rounded-2xl border px-4 py-3 ${isUser
                        ? "bg-primary/5 border-primary/15 text-ink"
                        : "bg-surface border-border text-ink shadow-[var(--shadow-soft)]"
                        }`}
                >
                    <div className="prose prose-sm max-w-none text-ink prose-p:my-0">
                        {isUser ? (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                            <>
                                {/* 1. Loading State */}
                                {message.isLoading && (
                                    <div className="flex items-center gap-2 text-ink-muted animate-pulse">
                                        <div className="w-2 h-2 bg-ink-muted rounded-full"></div>
                                        <div className="w-2 h-2 bg-ink-muted rounded-full animation-delay-200"></div>
                                        <div className="w-2 h-2 bg-ink-muted rounded-full animation-delay-400"></div>
                                    </div>
                                )}

                                {/* 2. Structured Response */}
                                {!message.isLoading && typeof message.content === 'object' && (
                                    <>
                                        {/* Explanation */}
                                        <p className="leading-relaxed mb-2">
                                            {message.content.chat_summary || message.content.content || message.content.explanation}
                                        </p>

                                        {/* Chart */}
                                        {message.content.chart_data && (
                                            <ChartView data={message.content.chart_data} />
                                        )}

                                        {/* Insights (Accepts 'insights' or 'key_insights' for compatibility) */}
                                        <InsightList
                                            insights={message.content.insights || message.content.key_insights}
                                        />
                                    </>
                                )}

                                {/* 3. Plain Text Fallback or Error */}
                                {!message.isLoading && typeof message.content === 'string' && (
                                    <p>{message.content}</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Message;
