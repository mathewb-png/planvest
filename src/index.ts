export { RAILS, railById } from "./rails.ts";
export { assertActionAllowed, describeBlockedReason, EMPTY_LICENSES } from "./gates.ts";
export { HSA_LIMITS_2026, remainingHsaRoom } from "./hsaLimits.ts";
export { illustrativeMix, splitDollars } from "./allocation.ts";
export { K401_LIMITS_2026, catchUpLimit, employeeDeferralLimit, employerMatch } from "./k401Limits.ts";
export { projectBalance } from "./k401Growth.ts";
export { SLEEVES, MENU_BRIDGES, buildPlan } from "./k401Plan.ts";
export { summarizeEarnings, timeslotLabel } from "./msn.ts";
export { sma, smaLine } from "./sma.ts";
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
