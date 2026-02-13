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
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-2.5 bg-surface/80 backdrop-blur-xl border border-border shadow-2xl rounded-xl transition-all duration-500 ease-in-out">
            {isProcessing ? (
                <>
                    <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs font-bold text-ink uppercase tracking-tight">Syncing Intelligence...</span>
                </>
            ) : (
                <>
                    <Zap className="w-4 h-4 text-success fill-success" />
                    <span className="text-xs font-bold text-ink uppercase tracking-tight">Protocol Updated</span>
                </>
            )}
        </div>
    );
};

export default FloatingStatusBubble;
