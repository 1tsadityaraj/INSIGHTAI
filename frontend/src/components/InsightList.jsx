import React from "react";
import { Lightbulb } from "lucide-react";

/**
 * InsightList Component
 * Displays a list of key insights with a stylized header.
 * @param {string[]} insights - Array of insight strings.
 */
const InsightList = ({ insights }) => {
    if (!insights || insights.length === 0) return null;

    return (
        <div className="mt-4 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3 text-blue-700">
                <Lightbulb className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wide">
                    Key Insights
                </h3>
            </div>
            <ul className="space-y-2">
                {insights.map((insight, index) => (
                    <li key={index} className="flex gap-2 text-gray-700 text-sm leading-relaxed">
                        <span className="text-blue-400 select-none">•</span>
                        {insight}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default InsightList;
