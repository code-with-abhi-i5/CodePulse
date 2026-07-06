"use client";

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'motion/react';
import { Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RepositoryGrowthProps {
  className?: string;
  data?: { month: string; value: number }[];
}

export function RepositoryGrowth({
  className,
  data: providedData,
}: RepositoryGrowthProps) {
  const monthlyData = useMemo(() => providedData || [], [providedData]);

  const option = useMemo(() => {
    const labels = monthlyData.map((d) => d.month);
    const values = monthlyData.map((d) => d.value);

    // Calculate dynamic max for better visual scaling
    const maxVal = Math.max(...values, 10);
    const yMax = Math.ceil(maxVal * 1.2);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(56, 189, 248, 0.2)',
        borderWidth: 1,
        textStyle: { color: '#fff' },
        padding: [12, 16],
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: 'rgba(56, 189, 248, 0.3)',
            width: 2,
            type: 'dashed'
          }
        },
        formatter: (params: any) => {
          const p = params[0];
          return `
            <div class="flex flex-col gap-1">
              <span class="text-xs text-sky-400 font-bold uppercase tracking-wider">${p.name}</span>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
                <span class="text-white font-black text-lg">${p.value} <span class="text-sm font-medium text-slate-400">contributions</span></span>
              </div>
            </div>
          `;
        },
      },
      grid: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 40,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          margin: 16,
        },
      },
      yAxis: {
        type: 'value',
        max: yMax,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          margin: 16,
        },
        splitLine: {
          lineStyle: { color: 'rgba(255,255,255,0.03)', type: 'dashed' },
        },
      },
      series: [
        {
          name: 'Contributions',
          type: 'bar',
          data: values,
          barWidth: '40%',
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#38bdf8' },
                { offset: 1, color: '#3b82f6' }
              ]
            },
            shadowColor: 'rgba(56, 189, 248, 0.4)',
            shadowBlur: 10,
            shadowOffsetY: 5
          }
        }
      ],
      animation: true,
      animationDuration: 1500,
      animationEasing: 'cubicOut',
    };
  }, [monthlyData]);

  // If no data, show empty state
  if (monthlyData.length === 0) {
    return (
      <div className={cn("glass-card rounded-[32px] border border-white/5 p-8 relative overflow-hidden group h-full flex flex-col justify-center items-center text-center", className)}>
        <Rocket className="w-10 h-10 text-slate-600 mb-3" />
        <p className="text-slate-400 font-medium">No contribution data yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/20">
              <Rocket className="w-5 h-5 text-sky-400" />
            </div>
            Contribution Growth
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            Your contribution trajectory over time.
          </p>
        </div>
      </div>
      
      <div className="flex-1 relative z-10 w-full min-h-[250px] -ml-2">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%', minHeight: '250px' }}
          opts={{ renderer: 'svg' }} // SVG renderer for sharper curves
          theme="dark"
        />
      </div>
    </div>
  );
}
