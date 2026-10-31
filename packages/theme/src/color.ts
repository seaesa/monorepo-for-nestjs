// oxlint-disable no-magic-numbers -- OKLab/sRGB conversion coefficients from the published formulas
/** Converts `oklch(L C H [/ A])` to a hex / rgba string — React Native and React Navigation don't parse oklch. */
export function oklchToRgb(value: string): string {
  const match = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)/.exec(
    value,
  );
  if (!match) return value;
  const [, l = '0', c = '0', h = '0', alpha, percent] = match;

  const hue = (Number(h) * Math.PI) / 180;
  const L = Number(l);
  const a = Number(c) * Math.cos(hue);
  const b = Number(c) * Math.sin(hue);

  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  const [r, g, bl] = linear.map((x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  }) as [number, number, number];

  if (alpha !== undefined) {
    const opacity = percent ? Number(alpha) / 100 : Number(alpha);
    return `rgba(${r}, ${g}, ${bl}, ${opacity})`;
  }
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}
