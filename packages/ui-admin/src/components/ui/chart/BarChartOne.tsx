"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export type BarChartSeries = {
  name: string;
  data: Array<number | null>;
};

type BarChartOneProps = {
  categories: string[];
  series: BarChartSeries[];
  colors?: string[];
  height?: number;
  minWidth?: number;
  valueFormatter?: (value: number) => string;
  axisValueFormatter?: (value: number) => string;
};

export default function BarChartOne({
  categories,
  series,
  colors = ["#465FFF"],
  height = 180,
  minWidth = 1000,
  valueFormatter = (value) => `${value}`,
  axisValueFormatter = (value) => `${value}`,
}: BarChartOneProps) {
  const visibleSeries = series.map((item) => ({
    ...item,
    data: item.data.map((value) => (value === 0 ? null : value)),
  }));

  const options: ApexOptions = {
    colors,
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 0,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: false,
      width: 0,
    },
    xaxis: {
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      title: {
        text: undefined,
      },
      labels: {
        formatter: axisValueFormatter,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: valueFormatter,
      },
    },
  };

  return (
    <div className="tailadmin-chart-with-static-tooltip custom-scrollbar max-w-full overflow-x-auto">
      <style>{`.tailadmin-chart-with-static-tooltip .apexcharts-tooltip { transition: none !important; }`}</style>
      <div style={{ minWidth }}>
        <ReactApexChart options={options} series={visibleSeries} type="bar" height={height} />
      </div>
    </div>
  );
}
