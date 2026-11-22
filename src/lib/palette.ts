// Chart colours for both themes. The series palettes are eight hues in a fixed order, tuned so
// that neighbours stay apart for protan and deutan vision and every slot has at least 3:1
// contrast against the chart surface of its theme.

export type Theme = 'light' | 'dark'

export interface ChartColours {
  surface: string
  ink: string
  grid: string
  series: readonly string[]
}

export const CHART_COLOURS: Record<Theme, ChartColours> = {
  light: {
    surface: '#ffffff',
    ink: '#4d535b',
    grid: '#e7e9ec',
    series: [
      '#1f6fd0',
      '#c9501c',
      '#00856f',
      '#b88000',
      '#c2447c',
      '#006b00',
      '#5a45cc',
      '#cc3535',
    ],
  },
  dark: {
    surface: '#17191c',
    ink: '#aeb5bd',
    grid: '#2a2e33',
    series: [
      '#3987e5',
      '#d95926',
      '#199e70',
      '#c98500',
      '#d55181',
      '#0ca30c',
      '#9085e9',
      '#e66767',
    ],
  },
}

export function slotColour(slot: number, theme: Theme): string {
  const { series } = CHART_COLOURS[theme]
  return series[slot % series.length]!
}
