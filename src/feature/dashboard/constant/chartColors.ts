// CSS variables keep SVG fills, axes and tooltips synchronized with the active theme.
// The slots are validated (index.css): assigned in fixed order to entities, never cycled past four.
export const CHART_CATEGORICAL_PALETTE = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"]
export const CHART_SERIES_COLOR = "var(--color-chart-1)"
export const CHART_OTHER_COLOR = "var(--color-chart-other)"
export const CHART_GRID_COLOR = "var(--color-line)"
export const CHART_AXIS_TEXT_COLOR = "var(--color-ink-600)"
export const CHART_CURSOR_COLOR = "color-mix(in srgb, var(--color-ink-900) 5%, transparent)"
