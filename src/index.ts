export { RAILS, railById } from "./rails.ts";
export { assertActionAllowed, describeBlockedReason, EMPTY_LICENSES } from "./gates.ts";
export { HSA_LIMITS_2026, remainingHsaRoom } from "./hsaLimits.ts";
export { ComplianceGateError } from "./types.ts";
export type {
  AccountKind,
  Action,
  Capability,
  LicenseNeed,
  LicenseState,
  Rail,
  RailId,
} from "./types.ts";
