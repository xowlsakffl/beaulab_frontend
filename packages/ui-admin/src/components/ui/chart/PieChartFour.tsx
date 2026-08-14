"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

import { buildChartTooltip, CHART_TOOLTIP_STYLES } from "./chartTooltip";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type PieChartFourProps = {
  labels: string[];
  series: number[];
  colors?: string[];
  height?: number;
  valueFormatter?: (value: number) => string;
  ratioFormatter?: (value: number) => string;
};

export default function PieChartFour({
  labels,
  series,
  colors = ["#C2D6FF", "#9CB9FF", "#465FFF", "#2D3282"],
  height = 304,
  valueFormatter = (value) => `${value}`,
  ratioFormatter = (value) => `${value.toFixed(1)}%`,
}: PieChartFourProps) {
  const total = series.reduce((sum, value) => sum + value, 0);
  const options: ApexOptions = {
    chart: {
      type: "pie",
      height,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: false,
      },
      fontFamily: "Outfit, sans-serif",
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
      },
    },
    labels,
    colors,
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: false,
      width: 0,
    },
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      markers: {
        shape: "circle",
        size: 6,
        offsetX: -2,
        strokeWidth: 0,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 4,
      },
      labels: {
        colors: "#344054",
      },
      fontSize: "14px",
      formatter: (seriesName, options) => {
        const value = series[options.seriesIndex] ?? 0;
        return `${seriesName} ${ratioFormatter(total > 0 ? (value / total) * 100 : 0)}`;
      },
    },
    tooltip: {
      followCursor: true,
      shared: false,
      intersect: true,
      custom: ({ series: chartSeries, seriesIndex, w }) => {
        const value = Number(chartSeries[seriesIndex] ?? 0);

        return buildChartTooltip({
          color: String(w.globals.colors[seriesIndex] ?? colors[seriesIndex] ?? "#F580AB"),
          label: String(w.globals.labels[seriesIndex] ?? labels[seriesIndex] ?? ""),
          value: valueFormatter(value),
        });
      },
    },
    states: {
      hover: {
        filter: {
          type: "none",
        },
      },
      active: {
        filter: {
          type: "none",
        },
      },
    },
  };

  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="tailadmin-chart-with-static-tooltip flex justify-center">
      <style>{CHART_TOOLTIP_STYLES}</style>
      <ReactApexChart options={options} series={series} type="pie" height={height} />
    </div>
  );
}
