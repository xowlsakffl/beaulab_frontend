"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

import { buildChartTooltip, CHART_TOOLTIP_STYLES } from "./chartTooltip";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export type BarChartSeries = {
  name: string;
  data: Array<number | null>;
};

type DoubleBarChartProps = {
  categories: string[];
  series: BarChartSeries[];
  colors?: string[];
  height?: number;
  minWidth?: number;
  yAxisStepSize?: number;
  valueFormatter?: (value: number) => string;
  axisValueFormatter?: (value: number) => string;
};

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function installGroupedBarHitAreas(chartElement: HTMLElement) {
  chartElement.querySelectorAll(".beaulab-bar-hit-area").forEach((element) => element.remove());

  const grid = chartElement.querySelector<SVGGraphicsElement>(".apexcharts-grid");
  const gridHeight = grid?.getBBox().height ?? 0;

  if (gridHeight <= 0) return;

  chartElement
    .querySelectorAll<SVGGraphicsElement>(".apexcharts-bar-area:not(.beaulab-bar-hit-area)")
    .forEach((bar) => {
      const value = Number(bar.getAttribute("val") ?? 0);

      if (!Number.isFinite(value) || !(bar.parentNode instanceof SVGElement)) return;

      const bounds = bar.getBBox();
      const hitArea = document.createElementNS(SVG_NAMESPACE, "rect");

      hitArea.setAttribute("class", "apexcharts-bar-area beaulab-bar-hit-area");
      hitArea.setAttribute("x", String(bounds.x));
      hitArea.setAttribute("y", "0");
      hitArea.setAttribute("width", String(bounds.width));
      hitArea.setAttribute("height", String(gridHeight));

      ["barWidth", "cx", "cy", "j", "val"].forEach((attribute) => {
        const attributeValue = bar.getAttribute(attribute);
        if (attributeValue !== null) hitArea.setAttribute(attribute, attributeValue);
      });

      ["mousemove", "mouseup", "mouseout"].forEach((eventName) => {
        hitArea.addEventListener(eventName, (event) => {
          if (!(event instanceof MouseEvent)) return;

          bar.dispatchEvent(
            new MouseEvent(eventName, {
              bubbles: false,
              cancelable: true,
              view: window,
              detail: event.detail,
              screenX: event.screenX,
              screenY: event.screenY,
              clientX: event.clientX,
              clientY: event.clientY,
              ctrlKey: event.ctrlKey,
              altKey: event.altKey,
              shiftKey: event.shiftKey,
              metaKey: event.metaKey,
              button: event.button,
              buttons: event.buttons,
              relatedTarget: event.relatedTarget,
            }),
          );
        });
      });

      bar.parentNode.insertBefore(hitArea, bar.parentNode.firstChild);
    });
}

export default function DoubleBarChart({
  categories,
  series,
  colors = ["#C2D6FF", "#465FFF"],
  height = 300,
  minWidth = 760,
  yAxisStepSize,
  valueFormatter = (value) => `${value}`,
  axisValueFormatter = (value) => `${value}`,
}: DoubleBarChartProps) {
  const options: ApexOptions = {
    colors,
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
      events: {
        mounted: (chartContext) => {
          requestAnimationFrame(() => installGroupedBarHitAreas(chartContext.el));
        },
        updated: (chartContext) => {
          requestAnimationFrame(() => installGroupedBarHitAreas(chartContext.el));
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "32%",
        borderRadius: 4,
        borderRadiusApplication: "end",
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
      crosshairs: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: "#373D3F",
        },
      },
    },
    yaxis: {
      min: 0,
      stepSize: yAxisStepSize,
      forceNiceScale: yAxisStepSize === undefined,
      labels: {
        formatter: axisValueFormatter,
        style: {
          fontSize: "12px",
          colors: "#344054",
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
    legend: {
      show: false,
    },
    grid: {
      borderColor: "#F2F4F7",
      strokeDashArray: 0,
    },
  };

  return (
    <div className="tailadmin-chart-with-static-tooltip tailadmin-chart-with-vertical-bar-hit-areas tailadmin-chart-with-hidden-zero-bars custom-scrollbar max-w-full overflow-x-auto">
      <style>{`
        ${CHART_TOOLTIP_STYLES}
        .tailadmin-chart-with-vertical-bar-hit-areas .apexcharts-bar-area:not(.beaulab-bar-hit-area) {
          pointer-events: none;
        }
        .tailadmin-chart-with-vertical-bar-hit-areas .beaulab-bar-hit-area {
          fill: transparent;
          fill-opacity: 0;
        }
        .tailadmin-chart-with-vertical-bar-hit-areas .beaulab-bar-hit-area:hover {
          fill: #f2f4f7;
          fill-opacity: 0.8;
        }
        .tailadmin-chart-with-hidden-zero-bars .apexcharts-bar-area:not(.beaulab-bar-hit-area)[val="0"] {
          opacity: 0 !important;
        }
      `}</style>
      <div className="-ml-1" style={{ minWidth }}>
        <ReactApexChart options={options} series={series} type="bar" height={height} />
      </div>
    </div>
  );
}
