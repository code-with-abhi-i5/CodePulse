'use client';

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CHART_THEME } from '@/lib/constants';
import { cn, formatNumber } from '@/lib/utils';
import type { LanguageStat } from '@/types';

interface LanguageDistributionProps {
  className?: string;
  data?: LanguageStat[];
}

export function LanguageDistribution({
  className,
  data,
}: LanguageDistributionProps) {
  const langData = data || [];

  const totalLines = useMemo(
    () => langData.reduce((sum, l) => sum + l.linesOfCode, 0),
    [langData]
  );

  const option = useMemo(() => {
    const data = langData.map((lang) => ({
      name: lang.name,
      value: lang.percentage,
      linesOfCode: lang.linesOfCode,
      repos: lang.repos,
      itemStyle: { color: lang.color },
    }));

    return {
      ...CHART_THEME,
      tooltip: {
        ...CHART_THEME.tooltip,
        trigger: 'item',
        formatter: (params: {
          name: string;
          value: number;
          marker: string;
          data: { linesOfCode: number; repos: number };
        }) => {
          return `
            <div style="padding: 4px 0;">
              <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; margin-bottom: 6px;">
                ${params.marker}
                <span>${params.name}</span>
              </div>
              <div style="color: #94a3b8; font-size: 12px; line-height: 1.8;">
                <div>${params.value}% of codebase</div>
                <div>${formatNumber(params.data.linesOfCode)} lines of code</div>
                <div>${params.data.repos} repositories</div>
              </div>
            </div>
          `;
        },
      },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: ['55%', '80%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          padAngle: 2,
          itemStyle: {
            borderRadius: 6,
            borderColor: 'transparent',
            borderWidth: 0,
          },
          label: { show: false },
          emphasis: {
            label: { show: false },
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0, 0, 0, 0.4)',
            },
            scaleSize: 8,
          },
          data,
        },
      ],
      graphic: [
        {
          type: 'group',
          left: 'center',
          top: 'center',
          children: [
            {
              type: 'text',
              style: {
                text: formatNumber(totalLines),
                fill: '#e2e8f0',
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'Inter, system-ui, sans-serif',
                textAlign: 'center',
              },
              left: 'center',
              top: -10,
            },
            {
              type: 'text',
              style: {
                text: 'lines of code',
                fill: '#64748b',
                fontSize: 11,
                fontFamily: 'Inter, system-ui, sans-serif',
                textAlign: 'center',
              },
              left: 'center',
              top: 14,
            },
          ],
        },
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }, [langData, totalLines]);

  return (
    <div
      className={cn(
        'rounded-[20px] border border-white/[0.06] bg-[#111827]/80 p-6 backdrop-blur-xl',
        className
      )}
    >
      <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-200">
        Language Distribution
      </h3>
      <ReactECharts
        option={option}
        style={{ height: '260px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        theme="dark"
      />
      {/* Custom legend */}
      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2 px-1">
        {langData.map((lang) => (
          <div
            key={lang.name}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: lang.color }}
              />
              <span className="text-slate-300">{lang.name}</span>
            </div>
            <span className="font-medium tabular-nums text-slate-400">
              {lang.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
