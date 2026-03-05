import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
}

const LineChart: React.FC<LineChartProps> = ({ data, color = "#3b82f6", height = 200 }) => {
  if (!data || data.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No data available</div>;

  const padding = 40;
  const chartWidth = 800;
  const chartHeight = height;
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (chartWidth - padding * 2) + padding;
    const y = chartHeight - ((d.value / maxValue) * (chartHeight - padding * 2) + padding);
    return { x, y };
  });

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaData = `${pathData} L ${points[points.length - 1].x},${chartHeight - padding} L ${points[0].x},${chartHeight - padding} Z`;

  return (
    <div className="line-chart-container" style={{ width: '100%', overflowX: 'auto', background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
          const y = chartHeight - (tick * (chartHeight - padding * 2) + padding);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(tick * maxValue)}</text>
            </g>
          );
        })}

        {/* Area */}
        <path d={areaData} fill={`${color}10`} />
        
        {/* Line */}
        <path d={pathData} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2" />
            <text x={p.x} y={chartHeight - 10} textAnchor="middle" fontSize="10" fill="#64748b">{data[i].label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default LineChart;
