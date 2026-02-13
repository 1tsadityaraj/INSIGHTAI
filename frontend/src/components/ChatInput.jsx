import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";

/**
 * ChatInput Component
 * Renders a text input area and a submit button.
 * @param {Function} onSend - Callback when user submits a query.
 * @param {boolean} isLoading - Visual state for the submit button.
 */
const ChatInput = ({ onSend, isLoading }) => {
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
            <div className="max-w-3xl mx-auto relative flex items-center">
                <input
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
