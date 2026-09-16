export type EligibilityOutcome = "ELIGIBLE" | "NOT_ELIGIBLE" | "MANUAL_REVIEW";

export type CaseStatus = "OPEN" | "AWAITING_ITEM" | "RECEIVED" | "RESOLVED" | "CANCELLED";

export type ReturnReason = "defective" | "wrong_item" | "not_as_described" | "changed_mind" | "damaged_in_transit";
export type ItemCondition = "new_unopened" | "opened_unused" | "used";

export type RuleCreator = "ai" | "merchant";
export type RuleApprovalState = "pending" | "approved" | "rejected" | "edited";

export type PlatformId = "salla" | "zid";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error" | "unavailable";

export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface DeliveryFacts {
  orderId: string;
  orderDate: string;
  deliveryDate: string | null;
  orderStatus: "delivered" | "shipped" | "processing" | "cancelled";
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  currency: string;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  value: string;
  creator: RuleCreator;
  approvalState: RuleApprovalState;
  sourceExcerpt: string;
  sourceRange: { start: number; end: number };
  category: "window" | "reasons" | "conditions" | "exclusions" | "order_status" | "quantity" | "fallback";
}

export interface PolicyVersion {
  id: string;
  versionLabel: string;
  publishedAt: string;
  publishedBy: string;
  rules: PolicyRule[];
  sourceText: string;
  frozenSnapshot: string;
}

export interface PolicyDraft {
  id: string;
  name: string;
  sourceText: string;
  rules: PolicyRule[];
  extractionState: "idle" | "reading" | "proposing" | "ready" | "error";
  createdAt: string;
  updatedAt: string;
}

export interface AppliedRuleResult {
  rule: PolicyRule;
  passed: boolean;
  evaluatedValue: string;
  reasonCode: string;
}

export interface EligibilityDecision {
  outcome: EligibilityOutcome;
  reasonCodes: string[];
  explanation: string;
  appliedRules: AppliedRuleResult[];
  policyVersionId: string;
  policyVersionLabel: string;
  evaluatedAt: string;
  relevantFacts: { label: string; value: string }[];
  deadline?: string;
}

export interface CaseEvent {
  id: string;
  type: "verification" | "evaluation" | "case_created" | "review" | "note" | "status_change";
  actor: "system" | "merchant" | "customer";
  timestamp: string;
  description: string;
  metadata?: Record<string, string>;
}

export interface CaseNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface ReturnCase {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reason: ReturnReason;
  condition: ItemCondition;
  outcome: EligibilityOutcome;
  caseStatus: CaseStatus;
  decision: EligibilityDecision;
  createdAt: string;
  updatedAt: string;
  events: CaseEvent[];
  notes: CaseNote[];
}

export interface PlatformConnection {
  platformId: PlatformId;
  platformName: string;
  state: ConnectionState;
  connectedAt?: string;
  lastSyncAt?: string;
  storeName?: string;
  isSimulated: boolean;
  available: boolean;
}

export const REASON_LABELS: Record<ReturnReason, string> = {
  defective: "Item is defective",
  wrong_item: "Wrong item received",
  not_as_described: "Not as described",
  changed_mind: "Changed my mind",
  damaged_in_transit: "Damaged in transit",
};

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  new_unopened: "New, unopened",
  opened_unused: "Opened, unused",
  used: "Used",
};

export const OUTCOME_LABELS: Record<EligibilityOutcome, string> = {
  ELIGIBLE: "Eligible",
  NOT_ELIGIBLE: "Not eligible",
  MANUAL_REVIEW: "Manual review",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  OPEN: "Open",
  AWAITING_ITEM: "Awaiting item",
  RECEIVED: "Received",
  RESOLVED: "Resolved",
  CANCELLED: "Cancelled",
};

export const DEMO_CLOCK = {
  now: new Date("2026-09-16T10:00:00+03:00"),
  timezone: "Asia/Riyadh",
};

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatSAR(amount: number): string {
  return `SAR ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
