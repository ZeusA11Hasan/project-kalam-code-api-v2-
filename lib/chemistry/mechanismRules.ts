import type { ReactionConditions } from "./conditionTypes"

export type MechanismType = "SN1" | "SN2" | "E1" | "E2" | "NONE"

export function decideMechanism(input: ReactionConditions): MechanismType {
  const { substrate, nucleophile, base, solvent, temperature } = input

  // SN2
  if (
    substrate === "primary" &&
    nucleophile === "strong" &&
    solvent === "polar_aprotic"
  ) {
    return "SN2"
  }

  // SN1
  if (
    substrate === "tertiary" &&
    nucleophile === "weak" &&
    solvent === "polar_protic"
  ) {
    return "SN1"
  }

  // E2
  if (base === "strong" && temperature === "high" && substrate !== "primary") {
    return "E2"
  }

  // E1
  if (substrate === "tertiary" && base === "weak" && temperature === "high") {
    return "E1"
  }

  return "NONE"
}
