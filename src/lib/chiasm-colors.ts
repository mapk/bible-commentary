/**
 * Rainbow Chiastic Color Generator
 * Generates colors for chiastic structures based on distance from center
 * Colors follow a rainbow pattern: red -> orange -> yellow -> green -> blue -> indigo -> violet
 * Moving outward from the center
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to hex string
 */
function rgbToHex(rgb: RGB): string {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    })
    .join("")}`;
}

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
 * Generate a rainbow color based on chiastic level
 * @param level The chiastic level (0 = center, higher = further out)
 * @param maxLevel Maximum level in the chiasm
 * @param saturation Saturation percentage (0-100), default 70
 * @param lightness Lightness percentage (0-100), default 50
 * @returns Hex color string
 */
export function getChiasticColor(
  level: number,
  maxLevel: number,
  saturation: number = 70,
  lightness: number = 50
): string {
  // Normalize level to 0-1 range
  const normalized = maxLevel > 0 ? level / maxLevel : 0;

  // Rainbow hue range: 0 (red) to 300 (violet)
  // Center (level 0) = red (0°)
  // Outer (max level) = violet (300°)
  // We'll use a smooth gradient
  const hue = normalized * 300;

  const rgb = hslToRgb(hue, saturation, lightness);
  return rgbToHex(rgb);
}

/**
 * Generate a lighter background color for highlighting verses
 * Uses the same hue but with higher lightness for better readability
 */
export function getChiasticBackgroundColor(
  level: number,
  maxLevel: number,
  saturation: number = 50,
  lightness: number = 90
): string {
  const normalized = maxLevel > 0 ? level / maxLevel : 0;
  const hue = normalized * 300;
  const rgb = hslToRgb(hue, saturation, lightness);
  return rgbToHex(rgb);
}

/**
 * Generate a border color (darker version)
 */
export function getChiasticBorderColor(
  level: number,
  maxLevel: number,
  saturation: number = 70,
  lightness: number = 40
): string {
  const normalized = maxLevel > 0 ? level / maxLevel : 0;
  const hue = normalized * 300;
  const rgb = hslToRgb(hue, saturation, lightness);
  return rgbToHex(rgb);
}

/**
 * Get all colors for a chiasm with N units
 * Returns an array of colors, one for each unit
 */
export function getChiasmColors(totalUnits: number): string[] {
  const maxLevel = Math.floor(totalUnits / 2);
  const colors: string[] = [];

  for (let i = 1; i <= totalUnits; i++) {
    const level = getChiasticLevel(i, totalUnits);
    colors.push(getChiasticBackgroundColor(level, maxLevel));
  }

  return colors;
}

