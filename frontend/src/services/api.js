const API_BASE_URL = "http://localhost:8000/api/v1";

export const api = {
    /**
     * Sends a user query to the InsightAI backend.
     * @param {string} query - The user's natural language query.
     * @returns {Promise<Object>} - The structured response from the backend.
     * Format: { explanation: string, key_insights: string[], chart_data?: Object }
     */
    async sendQuery(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            // More specific error handling
            if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                console.error("Backend connection failed. Is the server running on port 8000?");
                throw new Error("Unable to connect to the backend server. Please ensure it's running on http://localhost:8000");
            }
            console.error("Failed to fetch insight:", error);
            throw error;
        }
    },
};
