import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap } from 'lucide-react';

const FloatingStatusBubble = ({ isProcessing }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isProcessing) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 2000); // Keep visible for success state briefly
            return () => clearTimeout(timer);
        }
    }, [isProcessing]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-full animate-float transition-all duration-500 ease-in-out transform hover:scale-105">
            {isProcessing ? (
                <>
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-sm font-medium text-gray-700">Syncing Intelligence...</span>
                </>
            ) : (
                <>
                    <Zap className="w-5 h-5 text-green-500 fill-green-500" />
                    <span className="text-sm font-medium text-gray-700">Analysis Updated</span>
                </>
            )}
        </div>
    );
};

export default FloatingStatusBubble;
