export function detectGraphFunction(latex: string): string | null {
  if (!latex) return null

  // Normalize
  const clean = latex.replace(/\s+/g, "")

  // Match y = f(x)
  const match = clean.match(/^y=([a-zA-Z0-9^*+\/\-().]+)$/)

  if (!match) return null

  const rhs = match[1]

  // Disallow dangerous or non-graphable symbols
  if (/\\|sum|int|vec|dot|cross/.test(rhs)) return null

  return rhs
}
