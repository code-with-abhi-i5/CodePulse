"use client";

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface RepoSparklineProps {
  id: string;
  dataCount?: number;
  color?: string;
}

// Simple deterministic pseudo-random generator
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function RepoSparkline({ id, dataCount = 50, color = '#a855f7' }: RepoSparklineProps) {
  const data = useMemo(() => {
    // Generate a beautiful, deterministic wave based on repo string ID
    let seed = 0;
    for (let i = 0; i < id.length; i++) {
      seed += id.charCodeAt(i);
    }
    
    const arr = [];
    let prev = 20;
    for (let i = 0; i < 20; i++) {
      const change = (seededRandom(seed + i) - 0.5) * 15;
      prev = Math.max(5, Math.min(50, prev + change));
      arr.push(prev);
    }
    // Make sure the last point looks like an upward trend for gamification vibes
    arr[arr.length - 1] = Math.max(arr[arr.length - 2], arr[arr.length - 1] + 10);
    return arr;
  }, [id]);

  const option = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      grid: {
        top: 2,
        right: 0,
        bottom: 2,
        left: 0,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        show: false,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        show: false,
        min: 0,
        max: 60,
      },
      series: [
        {
          type: 'line',
          data: data,
          smooth: 0.4,
          showSymbol: false,
          lineStyle: {
            width: 2,
            color: color,
            shadowColor: color,
            shadowBlur: 5,
            shadowOffsetY: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${color}80` }, // 50% opacity
                { offset: 1, color: `${color}00` }, // 0% opacity
              ],
            },
          },
        },
      ],
      animation: true,
      animationDuration: 2000,
      animationEasing: 'cubicOut',
    };
  }, [data, color]);

  return (
    <div className="w-24 h-10 overflow-hidden pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
        theme="dark"
      />
    </div>
  );
}
