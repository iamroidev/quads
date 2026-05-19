export function getTypography(width: number) {
  const s = width < 640;
  return {
    h1:    s ? 22 : 28,
    h2:    s ? 18 : 22,
    h3:    s ? 15 : 18,
    body:  s ? 13 : 15,
    label: s ? 11 : 13,
    tag:   s ? 10 : 12,
  };
}