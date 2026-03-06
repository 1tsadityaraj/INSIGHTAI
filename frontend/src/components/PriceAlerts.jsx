import React, { useState, useEffect } from "react";
import { Bell, BellRing, Plus, X } from "lucide-react";
import { toast } from "react-toastify";

const PriceAlerts = ({ currentPrice, symbol }) => {
    const [alerts, setAlerts] = useState([]);
    const [targetPrice, setTargetPrice] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    // Initial Load
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem(`alerts-${symbol}`)) || [];
        const t = setTimeout(() => setAlerts(stored), 0);
        return () => clearTimeout(t);
    }, [symbol]);

    // Save Updates
    useEffect(() => {
        if (symbol) {
            localStorage.setItem(`alerts-${symbol}`, JSON.stringify(alerts));
        }
    }, [alerts, symbol]);

    // Logic: Check Alerts on Price Update
    useEffect(() => {
        if (!currentPrice || !alerts.length) return;

        alerts.forEach((alert) => {
            if (!alert.triggered) {
                let triggered = false;
                if (alert.condition === ">" && currentPrice >= alert.price) triggered = true;
                if (alert.condition === "<" && currentPrice <= alert.price) triggered = true;

                if (triggered) {
                    toast.success(`🔔 Alert: ${symbol.toUpperCase()} crossed $${alert.price.toLocaleString()}!`);

                    // Update trigger state 
                    setAlerts(prev => prev.map(a =>
                        a.id === alert.id ? { ...a, triggered: true } : a
                    ));

                    // Browser Notification
                    if (Notification.permission === "granted") {
                        new Notification("Market Alert", { body: `${symbol.toUpperCase()} hit $${alert.price}` });
                    }
                }
            }
        });
    }, [currentPrice, alerts, symbol]);

    const addAlert = () => {
        if (!targetPrice || isNaN(targetPrice)) return;
        const price = parseFloat(targetPrice);
        const condition = price > currentPrice ? ">" : "<";

        const newAlert = {
            id: Date.now(),
            price,
            condition,
            triggered: false
        };

        setAlerts([...alerts, newAlert]);
        setTargetPrice("");
        setIsOpen(false);
        toast.info(`Alert set for $${price.toLocaleString()}`);

        // Request notification permission
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    };

    const removeAlert = (id) => {
        setAlerts(alerts.filter(a => a.id !== id));
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="ui-icon-btn relative rounded-full border-0 bg-transparent hover:bg-surface-elevated"
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-controls="price-alerts-popover"
            >
                {alerts.some(a => !a.triggered)
                    ? <BellRing className="w-5 h-5 text-warning" />
                    : <Bell className="w-5 h-5 text-ink-muted" />
                }
                {alerts.length > 0 && (
                    <span className="absolute top-0 right-0 min-w-3 h-3 px-1 bg-error rounded-full text-[8px] flex items-center justify-center text-white font-bold">
                        {alerts.filter(a => !a.triggered).length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div id="price-alerts-popover" className="absolute right-0 top-12 w-72 ui-popover z-50 p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-ink text-sm">Price Alerts ({symbol?.toUpperCase()})</h4>
                        <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-ink-dim hover:text-ink" /></button>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input
                            type="number"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                            placeholder="Target Price..."
                            className="ui-input ui-input-sm"
                        />
                        <button
                            onClick={addAlert}
                            className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {alerts.length === 0 && <p className="text-xs text-ink-muted text-center py-2">No active alerts</p>}
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`flex justify-between items-center text-xs p-2 rounded-xl ${alert.triggered
                                    ? 'bg-base opacity-60 border border-border'
                                    : 'bg-warning/10 border border-warning/20'
                                    }`}
                            >
                                <span className={alert.triggered ? 'line-through text-ink-muted' : 'font-semibold text-ink'}>
                                    {alert.condition} ${alert.price.toLocaleString()}
                                </span>
                                <button onClick={() => removeAlert(alert.id)} className="text-ink-muted hover:text-error transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceAlerts;
