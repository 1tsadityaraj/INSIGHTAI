const API_BASE_URL = "http://localhost:8000/api/v1";

export const market = {
    /**
     * Fetches market data for a specific coin.
     * @param {string} coinId - The CoinGecko coin ID (e.g., 'bitcoin').
     * @param {number} days - Number of days for historical data.
     * @returns {Promise<Object>} - { kpi: Object, chart: Object }
     */
    fetchMarketData: async (coinId = "bitcoin", days = 30) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s Timeout

            const response = await fetch(`${API_BASE_URL}/market/${coinId}?days=${days}`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Market API Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') throw error; // Re-throw for caller to handle silently
            console.error("Market Service Error:", error);
            throw error;
        }
    },

    fetchComparison: async (symbols = [], range = "30") => {
        try {
            const symbolsStr = symbols.join(",");
            const response = await fetch(`${API_BASE_URL}/compare?symbols=${symbolsStr}&range=${range}`);
            if (!response.ok) throw new Error("Failed to fetch comparison");
            return await response.json();
        } catch (error) {
            console.error("Comparison Error:", error);
            throw error;
        }
    },

    fetchHeatmap: async (limit = 10) => {
        try {
            const response = await fetch(`${API_BASE_URL}/heatmap?limit=${limit}`);
            if (!response.ok) throw new Error("Failed to fetch heatmap");
            return await response.json();
        } catch (error) {
            console.error("Heatmap Error:", error);
            return [];
        }
    },

    fetchExplanation: async (symbol, days = "30") => {
        try {
            const response = await fetch(`${API_BASE_URL}/explain?symbol=${symbol}&days=${days}`);
            if (!response.ok) throw new Error("Failed to fetch explanation");
            return await response.json();
        } catch (error) {
            console.error("Explanation Error:", error);
            throw error;
        }
    }
};
