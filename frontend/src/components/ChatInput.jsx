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
            className="w-full"
        >
            {/* Quick Demo Actions */}
            <div className="flex gap-2 mb-3 justify-start overflow-x-auto pb-1 scrollbar-hide">
                <button
                    type="button"
                    onClick={() => onDemoClick?.('demo-bitcoin')}
                    className="ui-chip"
                >
                    Bitcoin (Demo)
                </button>
                <button
                    type="button"
                    onClick={() => onDemoClick?.('demo-usdinr')}
                    className="ui-chip"
                >
                    USD / INR
                </button>
                <button
                    type="button"
                    onClick={() => onDemoClick?.('demo-nvidia')}
                    className="ui-chip"
                >
                    Nvidia (Stock)
                </button>
            </div>

            <div className="ui-panel px-3 py-2 flex items-center gap-2">
                <input
                    // ... (rest is same)
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask InsightAI anything..."
                    disabled={isLoading}
                    className="ui-input border-0 bg-transparent shadow-none focus:ring-0 focus:border-transparent px-2 py-2.5"
                />
                <button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className={`p-2 rounded-xl transition-colors ${query.trim() && !isLoading
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "bg-border text-ink-muted cursor-not-allowed"
                        } active:scale-[0.98]`}
                    aria-label="Send message"
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
