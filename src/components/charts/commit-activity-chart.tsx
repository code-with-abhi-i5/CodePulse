'use client';

import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'motion/react';
import { CHART_THEME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TimeRange, CommitActivity } from '@/types';

const TIME_RANGES: { value: TimeRange; label: string; days: number }[] = [
  { value: '7d', label: '7d', days: 7 },
  { value: '30d', label: '30d', days: 30 },
  { value: '90d', label: '90d', days: 90 },
  { value: '1y', label: '1y', days: 365 },
];

interface CommitActivityChartProps {
  className?: string;
  data?: CommitActivity[];
}

export function CommitActivityChart({ className, data = [] }: CommitActivityChartProps) {
  const [range, setRange] = useState<TimeRange>('30d');

  const currentRange = TIME_RANGES.find((r) => r.value === range) ?? TIME_RANGES[1];
  const commitData = useMemo(() => {
    // Basic filter for the last X days based on range
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - currentRange.days);
    return data.filter(d => new Date(d.date) >= cutoff);
  }, [data, currentRange.days]);

  const option = useMemo(() => {
    const dates = commitData.map((d: CommitActivity) => d.date);
    const commits = commitData.map((d: CommitActivity) => d.commits);

    return {
      ...CHART_THEME,
      tooltip: {
        ...CHART_THEME.tooltip,
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          lineStyle: { color: 'rgba(168, 85, 247, 0.3)' },
          crossStyle: { color: 'rgba(168, 85, 247, 0.3)' },
          label: {
            backgroundColor: '#1e293b',
            color: '#e2e8f0',
          },
        },
        formatter: (params: Array<{ axisValue: string; value: number; marker: string }>) => {
          const p = params[0];
          const date = new Date(p.axisValue);
          const formatted = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          return `
            <div style="padding: 4px 0;">
              <div style="font-weight: 600; margin-bottom: 6px;">${formatted}</div>
              <div style="display: flex; align-items: center; gap: 6px;">
                ${p.marker}
                <span>${p.value} commits</span>
              </div>
            </div>
          `;
        },
      },
      grid: {
        top: 16,
        right: 16,
        bottom: 32,
        left: 48,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          fontFamily: 'Inter, system-ui, sans-serif',
          formatter: (val: string) => {
            const d = new Date(val);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          },
          interval: Math.max(Math.floor(dates.length / 6) - 1, 0),
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        splitLine: {
          lineStyle: { color: 'rgba(255,255,255,0.04)', type: 'dashed' },
        },
      },
      series: [
        {
          name: 'Commits',
          type: 'line',
          data: commits,
          smooth: 0.4,
          showSymbol: false,
          symbolSize: 6,
          emphasis: {
            focus: 'series',
            itemStyle: {
              borderColor: '#a855f7',
              borderWidth: 2,
              shadowBlur: 12,
              shadowColor: 'rgba(168, 85, 247, 0.5)',
            },
          },
          lineStyle: {
            width: 2.5,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#8b5cf6' },
                { offset: 0.5, color: '#a855f7' },
                { offset: 1, color: '#6366f1' },
              ],
            },
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139, 92, 246, 0.35)' },
                { offset: 0.5, color: 'rgba(139, 92, 246, 0.1)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0)' },
              ],
            },
          },
        },
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }, [commitData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={cn(
        'rounded-[20px] border border-white/[0.06] bg-[#111827]/80 p-6 backdrop-blur-xl',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-slate-200">
          Commit Activity
        </h3>
        <Tabs
          defaultValue={1}
          onValueChange={(val) => {
            const matched = TIME_RANGES[val as number];
            if (matched) setRange(matched.value);
          }}
        >
          <TabsList className="h-7 rounded-lg bg-white/[0.04] p-0.5">
            {TIME_RANGES.map((r, index) => (
              <TabsTrigger
                key={r.value}
                value={index}
                className="h-6 rounded-md px-2.5 text-[11px] font-medium text-slate-400 data-[active]:bg-purple-500/20 data-[active]:text-purple-300"
              >
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <ReactECharts
        option={option}
        style={{ height: '350px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        theme="dark"
        notMerge
      />
    </motion.div>
  );
}
