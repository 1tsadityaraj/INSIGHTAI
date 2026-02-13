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
        <div className={`flex w-full ${isUser ? "bg-white dark:bg-slate-800" : "bg-gray-50 dark:bg-slate-900"} py-8 animate-in fade-in duration-200`}>
            <div className="max-w-3xl w-full mx-auto px-4 flex gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-gray-200 dark:bg-slate-700" : "bg-primary"
                            }`}
                    >
                        {isUser ? (
                            <User className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        ) : (
                            <Bot className="w-5 h-5 text-white" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                    <div className="prose prose-sm max-w-none text-gray-800 dark:text-slate-200">
                        {isUser ? (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                            <>
                                {/* 1. Loading State */}
                                {message.isLoading && (
                                    <div className="flex items-center gap-2 text-gray-400 animate-pulse">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animation-delay-200"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animation-delay-400"></div>
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
