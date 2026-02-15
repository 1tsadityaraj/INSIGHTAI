import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";

/**
 * ChatInput Component
 * Renders a text input area and a submit button.
 * @param {Function} onSend - Callback when user submits a query.
 * @param {boolean} isLoading - Visual state for the submit button.
 */
const ChatInput = ({ onSend, isLoading, onDemoClick }) => {
    const [query, setQuery] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim() && !isLoading) {
            onSend(query);
            setQuery("");
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };
    return (
        <form
            onSubmit={handleSubmit}
            className="p-4"
        >
            {/* Quick Demo Actions */}
            <div className="flex gap-2 mb-3 justify-center overflow-x-auto pb-1 scrollbar-hide">
                <button
                    type="button"
                    onClick={() => onDemoClick?.('demo-bitcoin')}
                    className="whitespace-nowrap px-3 py-1 bg-surface border border-border rounded-full text-[10px] font-bold text-ink-dim hover:text-primary hover:border-primary/50 transition-colors uppercase tracking-wide"
                >
                    Bitcoin (Demo)
                </button>
                <button
                    type="button"
                    onClick={() => onDemoClick?.('demo-usdinr')}
                    className="whitespace-nowrap px-3 py-1 bg-surface border border-border rounded-full text-[10px] font-bold text-ink-dim hover:text-primary hover:border-primary/50 transition-colors uppercase tracking-wide"
                >
                    USD / INR
                </button>
                <button
                    type="button"
                    onClick={() => onDemoClick?.('demo-nvidia')}
                    className="whitespace-nowrap px-3 py-1 bg-surface border border-border rounded-full text-[10px] font-bold text-ink-dim hover:text-primary hover:border-primary/50 transition-colors uppercase tracking-wide"
                >
                    Nvidia (Stock)
                </button>
            </div>

            <div className="max-w-3xl mx-auto relative flex items-center">
                <input
                    // ... (rest is same)
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask InsightAI anything..."
                    disabled={isLoading}
                    className="w-full bg-base border border-border rounded-[14px] py-3 pl-6 pr-14 focus:ring-4 focus:ring-primary/10 focus:border-primary/40 focus:outline-none shadow-sm text-ink placeholder-ink-dim/40 transition-all duration-200"
                />
                <button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className={`absolute right-3 p-2 rounded-lg transition-all ${query.trim() && !isLoading
                        ? "text-primary hover:bg-primary/10"
                        : "text-ink-dim/30 cursor-not-allowed"
                        }`}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
            <p className="text-[10px] text-center text-ink-dim/50 mt-3 font-normal uppercase tracking-wider">
                InsightAI · Deep Analysis Protocol active
            </p>
        </form>
    );
};

export default ChatInput;
