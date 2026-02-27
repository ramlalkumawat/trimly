import React from 'react';
import {
  LineChart as ReLine,
  BarChart as ReBar,
  PieChart as RePie,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Line,
  Bar,
  Pie,
  Sector,
} from 'recharts';

// Dashboard chart wrappers with consistent card layout and fallback handling.
export const LineChart = ({ data, height = 300 }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
      <h3 className="font-bold text-text-primary mb-4">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ReLine data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <XAxis dataKey="label" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#ffcc00" strokeWidth={2} />
        </ReLine>
      </ResponsiveContainer>
    </div>
  );
};

export const BarChart = ({ data, title = 'Data' }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
      <h3 className="font-bold text-text-primary mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ReBar data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <XAxis dataKey="label" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Bar dataKey="value" fill="#ffcc00" />
        </ReBar>
      </ResponsiveContainer>
    </div>
  );
};

export const PieChart = ({ data, title = 'Distribution' }) => {
  if (!data || data.length === 0) return null;
  const COLORS = ['#ffcc00', '#ff9f43', '#ff6b6b', '#4ecdc4', '#45b7d1'];
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
      <h3 className="font-bold text-text-primary mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RePie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </RePie>
      </ResponsiveContainer>
    </div>
  );
};
