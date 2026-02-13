import { useState, useEffect, useRef } from "react";

const useCryptoWebSocket = (symbol) => {
    const [priceData, setPriceData] = useState(null);
    const [status, setStatus] = useState("DISCONNECTED");
    const ws = useRef(null);
    const retryTimeout = useRef(null);

    useEffect(() => {
        if (!symbol) return;

        const connect = () => {
            const wsUrl = (import.meta.env && import.meta.env.VITE_WS_URL) || "ws://127.0.0.1:8000/api/v1/ws";
            const url = `${wsUrl}/${symbol}`;

            ws.current = new WebSocket(url);

            ws.current.onopen = () => {
                setStatus("CONNECTED");
                if (retryTimeout.current) clearTimeout(retryTimeout.current);
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data && data.price) {
                        setPriceData(data);
                    }
                } catch (e) {
                    console.error("WS Parse Error", e);
                }
            };

            ws.current.onclose = () => {
                setStatus("DISCONNECTED");
                // Retry after 5s
                retryTimeout.current = setTimeout(connect, 5000);
            };

            ws.current.onerror = (e) => {
                console.warn("WS Error", e); // Don't spam error logs
                ws.current.close();
            };
        };

        connect();

        return () => {
            if (ws.current) ws.current.close();
            if (retryTimeout.current) clearTimeout(retryTimeout.current);
        };
    }, [symbol]);

    return { priceData, status };
};

export default useCryptoWebSocket;
