/** Presentation only: keep a rounding-level negative zero out of the UI. */
export function formatFixed(value: number, digits: number): string {
  const rounded=value.toFixed(digits)
  return Number(rounded)===0 ? (0).toFixed(digits) : rounded
}
