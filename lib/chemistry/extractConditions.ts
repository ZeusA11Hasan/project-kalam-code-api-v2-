import type { ReactionConditions } from "./conditionTypes"

export function extractConditions(text: string): ReactionConditions {
  const t = text.toLowerCase()

  const conditions: ReactionConditions = {
    substrate: "unknown",
    nucleophile: "unknown",
    base: "unknown",
    solvent: "unknown",
    temperature: "unknown"
  }

  // Substrate hints
  if (/tert|tertiary/.test(t)) conditions.substrate = "tertiary"
  else if (/secondary|sec-/.test(t)) conditions.substrate = "secondary"
  else if (/primary|1°/.test(t)) conditions.substrate = "primary"

  // Nucleophile strength
  if (/\boh-|\bcn-|\bnh2-/.test(t)) conditions.nucleophile = "strong"
  // Check for weak nucleophiles (water, alcohol)
  if (/\bh2o|\broh|\bwater|\balcohol/.test(t)) {
    // If it hasn't been marked strong (e.g. OH- overrides H2O technically, but let's just mark weak if found and not strong overlap in specific phrases?)
    // Simple logic: if conflicting, we might need better parser. But for now:
    if (conditions.nucleophile === "unknown") conditions.nucleophile = "weak"
  }

  // Base strength
  if (/\bok-|\bnaoh|\bko(t)?bu|\bhydroxide|\bethoxide/.test(t))
    conditions.base = "strong"
  if (/\bh2o|\broh/.test(t) && conditions.base === "unknown")
    conditions.base = "weak"

  // Solvent
  if (/dmso|acetone|dmf/.test(t)) conditions.solvent = "polar_aprotic"
  if (/water|alcohol|ethanol|methanol/.test(t))
    conditions.solvent = "polar_protic"

  // Temperature
  if (/heat|high temp|\bΔ\b/.test(t)) conditions.temperature = "high"
  if (/cold|low temp/.test(t)) conditions.temperature = "low"

  return conditions
}
