'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  data: { month: string; value: number }[];
}

interface TrendTooltipPayloadItem {
  dataKey?: string | number;
  color?: string;
  name?: React.ReactNode;
  value?: React.ReactNode;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: React.ReactNode;
  payload?: TrendTooltipPayloadItem[];
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '0.75rem 1rem',
      boxShadow: 'var(--shadow-lg)',
      fontSize: '0.8rem',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>{label}</div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted-foreground)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: p.color, display: 'inline-block' }} />
          {p.name}: <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ series, height = 280 }: { series: TrendSeries[]; height?: number }) {
  const months = series[0]?.data.map(d => d.month) || [];
  const merged = months.map((month, i) => {
    const point: Record<string, string | number> = { month };
    series.forEach(s => { point[s.key] = s.data[i]?.value ?? 0; });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={merged} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          {series.map(s => (
            <linearGradient key={s.key} id={`trend-fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={(props) => <CustomTooltip {...(props as unknown as CustomTooltipProps)} />} />
        {series.map(s => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2.5}
            fill={`url(#trend-fill-${s.key})`}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
