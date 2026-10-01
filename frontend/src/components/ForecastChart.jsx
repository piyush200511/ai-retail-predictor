import { useMemo } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

export default function ForecastChart({ forecasts, history = [], height = 360 }) {
  // Combine history + forecast into a unified timeline
  const chartData = useMemo(() => {
    const hist = history.map((h) => ({
      date: h.demand_date,
      historical: Number(h.net_demand),
      predicted: null,
      lower: null,
      upper: null,
    }));

    const fore = forecasts.map((f) => ({
      date: f.forecast_date,
      historical: null,
      predicted: Number(f.predicted_demand),
      lower: Number(f.lower_bound),
      upper: Number(f.upper_bound),
    }));

    return [...hist, ...fore];
  }, [history, forecasts]);

  if (chartData.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm">
        No forecast data available.
      </div>
    );
  }

  // Find where history ends (for the reference line)
  const splitDate = history.length > 0 ? history[history.length - 1].demand_date : null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickFormatter={(d) => d.slice(5)}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          formatter={(value, name) => {
            if (value == null) return null;
            const labels = {
              historical: 'Historical demand',
              predicted: 'Predicted',
              lower: 'Lower bound',
              upper: 'Upper bound',
            };
            return [Number(value).toFixed(2), labels[name] || name];
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
          formatter={(v) => {
            const labels = {
              historical: 'Historical',
              predicted: 'Predicted',
              upper: 'Confidence band',
            };
            return labels[v] || v;
          }}
        />

        {/* Confidence band (upper shown, lower hidden as area renders from 0) */}
        <Area
          type="monotone"
          dataKey="upper"
          stroke="none"
          fill="url(#confidenceBand)"
          name="upper"
          connectNulls={false}
        />
        <Area
          type="monotone"
          dataKey="lower"
          stroke="none"
          fill="#fff"
          name="lower"
          connectNulls={false}
        />

        {/* Historical line */}
        <Line
          type="monotone"
          dataKey="historical"
          stroke="#94a3b8"
          strokeWidth={2}
          dot={false}
          name="historical"
          connectNulls={false}
        />

        {/* Predicted line */}
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#14b8a6"
          strokeWidth={2.5}
          strokeDasharray="4 4"
          dot={{ r: 3, fill: '#14b8a6' }}
          name="predicted"
          connectNulls={false}
        />

        {/* Vertical split line */}
        {splitDate && (
          <ReferenceLine
            x={splitDate}
            stroke="#cbd5e1"
            strokeDasharray="3 3"
            label={{
              value: 'Today',
              position: 'top',
              fill: '#64748b',
              fontSize: 10,
            }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}