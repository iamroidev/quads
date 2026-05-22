/**
 * Safely extract a single uppercase initial character from a name-like string.
 * Returns the provided fallback (default 'S') when the input is missing,
 * not a string, or empty/whitespace.
 */
export function getInitial(name?: string | null, fallback: string = 'S'): string {
  if (typeof name !== 'string') return fallback.toUpperCase();
  const trimmed = name.trim();
  if (!trimmed) return fallback.toUpperCase();
  return trimmed.charAt(0).toUpperCase();
}

export default getInitial;