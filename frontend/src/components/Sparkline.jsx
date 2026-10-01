import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data, color = '#14b8a6', height = 40 }) {
  if (!data || !data.length) return null;

  return (
    <div style={{ height }} className="-mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((v, i) => ({ i, v }))}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}