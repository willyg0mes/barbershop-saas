/**
 * Relative luminance (0–1) for a hex color. Returns 0 on invalid input.
 */
export function hexLuminance(hex: string): number {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return 0;
  }

  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

/** Black or near-white text for readable contrast on `bg`. */
export function contrastText(bg: string): "#0a0a0a" | "#f5f5f5" {
  return hexLuminance(bg) > 0.45 ? "#0a0a0a" : "#f5f5f5";
}

/** Prefer `candidate` on `bg` when contrast is enough; otherwise fall back. */
export function readableOn(bg: string, candidate: string): string {
  const bgL = hexLuminance(bg);
  const fgL = hexLuminance(candidate);
  const ratio =
    (Math.max(bgL, fgL) + 0.05) / (Math.min(bgL, fgL) + 0.05);

  return ratio >= 2.6 ? candidate : contrastText(bg);
}
