"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

import type { BarChartSeries } from "./DoubleBarChart";
import { buildChartTooltip, CHART_TOOLTIP_STYLES } from "./chartTooltip";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type HorizontalGroupedBarChartProps = {
  categories: string[];
  series: BarChartSeries[];
  colors?: string[];
  height?: number;
  minWidth?: number;
  barHeight?: string;
  valueFormatter?: (value: number) => string;
  axisValueFormatter?: (value: number) => string;
};

export default function HorizontalGroupedBarChart({
  categories,
  series,
  colors = ["#465FFF", "#E4E7EC"],
  height = 300,
  minWidth = 700,
  barHeight = "40%",
  valueFormatter = (value) => `${value}`,
  axisValueFormatter = (value) => `${value}`,
}: HorizontalGroupedBarChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "bar",
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
      bar: {
        horizontal: true,
        barHeight,
        borderRadius: 4,
        borderRadiusApplication: "end",
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors,
    series,
    xaxis: {
      categories,
      crosshairs: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
      labels: {
        formatter: (value) => axisValueFormatter(Number(value)),
        style: {
          fontSize: "12px",
          colors: "#667085",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: "#344054",
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      markers: {
        shape: "circle",
        size: 6,
      },
      itemMargin: {
        horizontal: 12,
      },
      labels: {
        colors: "#344054",
      },
    },
    grid: {
      borderColor: "#F2F4F7",
      strokeDashArray: 0,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      shared: false,
      intersect: true,
      followCursor: true,
      onDatasetHover: {
        highlightDataSeries: false,
      },
      x: {
        show: false,
      },
      custom: ({ series: chartSeries, seriesIndex, dataPointIndex, w }) => {
        const value = Number(chartSeries[seriesIndex]?.[dataPointIndex] ?? 0);

        return buildChartTooltip({
          color: String(w.globals.colors[seriesIndex] ?? colors[seriesIndex] ?? "#F580AB"),
          label: String(w.globals.seriesNames[seriesIndex] ?? ""),
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

  return (
    <div className="tailadmin-chart-with-static-tooltip custom-scrollbar max-w-full overflow-x-auto">
      <style>{CHART_TOOLTIP_STYLES}</style>
      <div style={{ minWidth }}>
        <ReactApexChart options={options} series={series} type="bar" height={height} />
      </div>
    </div>
  );
}
