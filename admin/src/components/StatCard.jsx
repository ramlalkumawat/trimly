import React from 'react';

// KPI card used on dashboard to highlight summary metrics with trends.
const StatCard = ({ icon, label, value, subtext, trend, trendColor = 'green' }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <h3 className="text-3xl font-bold text-text-primary mt-2">{value}</h3>

          {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}

          {trend && (
            <div className={`mt-2 text-sm font-semibold flex items-center gap-1 ${
              trendColor === 'green' ? 'text-green-600' :
              trendColor === 'red' ? 'text-red-600' :
              'text-blue-600'
            }`}>
              {trendColor === 'green' ? '↑' : trendColor === 'red' ? '↓' : '→'}
              {trend}
            </div>
          )}
        </div>

        {icon && <div className="text-4xl">{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;
