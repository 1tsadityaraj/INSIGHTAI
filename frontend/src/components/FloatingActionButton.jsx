import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

const FloatingActionButton = ({ onInsightRequest }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Show button when page is scrolled down
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 right-6 z-40 transition-all duration-500 ease-in-out animate-float">
            <button
                onClick={onInsightRequest}
                className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-3 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="font-semibold text-sm">Quick Insight</span>
            </button>
        </div>
    );
};

export default FloatingActionButton;
