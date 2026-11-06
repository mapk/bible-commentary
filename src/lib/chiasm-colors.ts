/**
 * Rainbow Chiastic Color Generator
 * Colors follow a rainbow pattern by distance from the center of a chiasm:
 * red at the center, moving outward to violet.
 *
 * Only the hue is computed here. Saturation and lightness come from the
 * --chiasm-* tokens in globals.css, so colors follow the active theme.
 */

/**
 * Get the chiastic level (distance from center) for a unit
 * @param unitOrder The order of the unit (1-based)
 * @param totalUnits Total number of units in the chiasm
 * @returns The level (0 = center, 1 = one step out, etc.)
 */
export function getChiasticLevel(unitOrder: number, totalUnits: number): number {
  const center = Math.ceil(totalUnits / 2);
  return Math.abs(unitOrder - center);
}

/**
 * Rainbow hue for a level: 0 (red) at the center to 300 (violet) at the edge.
 */
function getChiasticHue(level: number, maxLevel: number): number {
  const normalized = maxLevel > 0 ? level / maxLevel : 0;
  return normalized * 300;
}

/**
 * Background color for highlighted verses and structure cards.
 * Returns a CSS color that depends on theme tokens, for use in inline styles.
 */
export function getChiasticBackgroundColor(
  level: number,
  maxLevel: number
): string {
  return `hsl(${getChiasticHue(level, maxLevel)} var(--chiasm-surface))`;
}

/**
 * Stronger color for card borders and label badges.
 * Pair badge text with the --chiasm-on-accent token.
 */
export function getChiasticAccentColor(
  level: number,
  maxLevel: number
): string {
  return `hsl(${getChiasticHue(level, maxLevel)} var(--chiasm-accent))`;
}
