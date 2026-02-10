import React from 'react';

const KPICard = ({ label, value, subValue, icon: Icon, trend }) => {
    const isPositive = trend === 'up';
    const isNegative = trend === 'down';

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-full min-h-[100px]">
            <div className="flex justify-between items-start mb-2">
                <span className="text-gray-500 text-sm font-medium uppercase tracking-wide">{label}</span>
                {Icon && <Icon className="w-5 h-5 text-gray-400" />}
            </div>

            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>

            {subValue && (
                <div className={`text-xs font-medium mt-1 flex items-center ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
                    }`}>
                    {subValue}
                </div>
            )}
        </div>
    );
};

export default KPICard;
