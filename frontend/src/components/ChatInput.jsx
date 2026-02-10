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
            className="border-t border-gray-200 bg-white p-4 sticky bottom-0"
        >
            <div className="max-w-3xl mx-auto relative flex items-center">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask InsightAI anything (e.g., 'Analyze Bitcoin trends')..."
                    disabled={isLoading}
                    className="w-full bg-gray-100 border-0 rounded-full py-4 pl-6 pr-14 focus:ring-2 focus:ring-secondary focus:outline-none shadow-sm text-gray-800 placeholder-gray-500"
                />
                <button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className={`absolute right-2 p-2 rounded-full transition-colors ${query.trim() && !isLoading
                            ? "bg-secondary text-white hover:bg-blue-600"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">
                InsightAI can make mistakes. Consider checking important information.
            </p>
        </form>
    );
};

export default ChatInput;
