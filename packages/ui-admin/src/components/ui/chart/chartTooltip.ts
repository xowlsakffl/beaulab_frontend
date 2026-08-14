type ChartTooltipContent = {
  color: string;
  label: string;
  value: string;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

export function buildChartTooltip({ color, label, value }: ChartTooltipContent) {
  return `
    <div class="beaulab-chart-tooltip">
      <span class="beaulab-chart-tooltip__marker" style="background-color:${escapeHtml(color)}"></span>
      <span class="beaulab-chart-tooltip__label">${escapeHtml(label)}</span>
      <strong class="beaulab-chart-tooltip__value">${escapeHtml(value)}</strong>
    </div>
  `;
}

export const CHART_TOOLTIP_STYLES = `
  .tailadmin-chart-with-static-tooltip .apexcharts-tooltip {
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    border: 1px solid #e4e7ec !important;
    border-radius: 8px !important;
    background: #ffffff !important;
    box-shadow: 0 4px 12px rgba(16, 24, 40, 0.08) !important;
    transition: none !important;
  }
  .beaulab-chart-tooltip {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    margin: 0;
    color: #344054;
    font-size: 12px;
    line-height: 18px;
    white-space: nowrap;
  }
  .beaulab-chart-tooltip__marker {
    width: 8px;
    height: 8px;
    flex: none;
    border-radius: 9999px;
  }
  .beaulab-chart-tooltip__label {
    font-weight: 500;
  }
  .beaulab-chart-tooltip__value {
    color: #101828;
    font-weight: 600;
  }
`;
