"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type PieChartOneProps = {
  labels: string[];
  series: number[];
  colors?: string[];
  height?: number;
  totalLabel?: string;
  valueFormatter?: (value: number) => string;
  ratioFormatter?: (value: number) => string;
};

export default function PieChartOne({
  labels,
  series,
  colors = ["#7592FF", "#7CD4FD", "#BDB4FE"],
  height = 320,
  totalLabel = "전체",
  valueFormatter = (value) => `${value}`,
  ratioFormatter = (value) => `${value.toFixed(1)}%`,
}: PieChartOneProps) {
  const total = series.reduce((sum, value) => sum + value, 0);
  const options: ApexOptions = {
    chart: {
      type: "donut",
      height,
      toolbar: {
        show: false,
      },
      fontFamily: "Outfit, sans-serif",
    },
    series,
    labels,
    colors,
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          background: "transparent",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "13px",
              fontWeight: "400",
              color: "#667085",
              offsetY: 20,
            },
            value: {
              show: true,
              fontSize: "28px",
              fontWeight: "700",
              color: "#101828",
              offsetY: -16,
              formatter: (value) => valueFormatter(Number(value)),
            },
            total: {
              show: true,
              label: totalLabel,
              fontSize: "13px",
              fontWeight: "400",
              color: "#667085",
              formatter: () => valueFormatter(total),
            },
          },
        },
      },
    },
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
        horizontal: 10,
        vertical: 4,
      },
      labels: {
        colors: "#344054",
      },
      fontSize: "13px",
      formatter: (seriesName, options) => {
        const value = series[options.seriesIndex] ?? 0;
        return `${seriesName} ${ratioFormatter(total > 0 ? (value / total) * 100 : 0)}`;
      },
    },
    tooltip: {
      enabled: false,
    },
  };

  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return <ReactApexChart options={options} series={series} type="donut" height={height} />;
}
