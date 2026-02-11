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
            console.error("Market Service Error:", error);
            throw error;
        }
    }
};
