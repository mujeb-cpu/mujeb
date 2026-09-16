import {
  type DeliveryFacts,
  type PolicyVersion,
  type PolicyDraft,
  type PolicyRule,
  type ReturnCase,
  type PlatformConnection,
  type OrderItem,
} from "./domain";

export const SAMPLE_POLICY_TEXT = `Returns and Refunds Policy

1. Return Window
Customers may return eligible items within 14 days of delivery. The return window starts from the confirmed delivery date shown in the order tracking system.

2. Eligible Reasons
Returns are accepted for the following reasons: defective items, wrong item received, item not as described, and damage during transit. Returns for "changed mind" are not accepted.

3. Item Condition
Items must be in new, unopened condition or opened but unused with all original packaging and accessories. Used items are not eligible for return.

4. Excluded Items
Final sale items (SKU starting with FS) and personal care products are excluded from returns.

5. Order Status
Returns are only accepted for orders with "delivered" status. Orders that are still processing, shipped but not delivered, or cancelled are not eligible.

6. Quantity
Customers may return up to the full quantity of each item in the order. Partial returns are allowed.

7. Missing Information
If the delivery date or order status cannot be verified, the return request will be held for manual review by the store team.`;

export const SAMPLE_POLICY_RULES: PolicyRule[] = [
  {
    id: "rule-window",
    name: "Return window",
    description: "Items must be returned within 14 days of delivery",
    value: "14",
    creator: "ai",
    approvalState: "approved",
    sourceExcerpt: "Customers may return eligible items within 14 days of delivery.",
    sourceRange: { start: 33, end: 91 },
    category: "window",
  },
  {
    id: "rule-reasons",
    name: "Allowed return reasons",
    description: "Defective, wrong item, not as described, damaged in transit",
    value: "defective,wrong_item,not_as_described,damaged_in_transit",
    creator: "ai",
    approvalState: "approved",
    sourceExcerpt: "Returns are accepted for the following reasons: defective items, wrong item received, item not as described, and damage during transit.",
    sourceRange: { start: 95, end: 240 },
    category: "reasons",
  },
  {
    id: "rule-conditions",
    name: "Accepted item conditions",
    description: "New unopened or opened unused",
    value: "new_unopened,opened_unused",
    creator: "ai",
    approvalState: "approved",
    sourceExcerpt: "Items must be in new, unopened condition or opened but unused with all original packaging and accessories.",
    sourceRange: { start: 244, end: 352 },
    category: "conditions",
  },
  {
    id: "rule-exclusions",
    name: "Excluded items",
    description: "Final sale items (SKU starting with FS) are excluded",
    value: "FS",
    creator: "ai",
    approvalState: "approved",
    sourceExcerpt: "Final sale items (SKU starting with FS) and personal care products are excluded from returns.",
    sourceRange: { start: 356, end: 456 },
    category: "exclusions",
  },
  {
    id: "rule-order-status",
    name: "Required order status",
    description: "Order must be delivered",
    value: "delivered",
    creator: "ai",
    approvalState: "approved",
    sourceExcerpt: "Returns are only accepted for orders with \"delivered\" status.",
    sourceRange: { start: 460, end: 527 },
    category: "order_status",
  },
  {
    id: "rule-quantity",
    name: "Maximum return quantity",
    description: "Up to full quantity of each item",
    value: "999",
    creator: "ai",
    approvalState: "approved",
    sourceExcerpt: "Customers may return up to the full quantity of each item in the order.",
    sourceRange: { start: 531, end: 605 },
    category: "quantity",
  },
  {
    id: "rule-fallback",
    name: "Missing data fallback",
    description: "Hold for manual review if delivery date or order status is unavailable",
    value: "manual_review",
    creator: "ai",
    approvalState: "approved",
    sourceExcerpt: "If the delivery date or order status cannot be verified, the return request will be held for manual review.",
    sourceRange: { start: 609, end: 740 },
    category: "fallback",
  },
];

export const PUBLISHED_POLICY_V1: PolicyVersion = {
  id: "pol-v1-001",
  versionLabel: "v1.0",
  publishedAt: "2026-09-01T09:00:00+03:00",
  publishedBy: "demo@novastore.sa",
  rules: SAMPLE_POLICY_RULES,
  sourceText: SAMPLE_POLICY_TEXT,
  frozenSnapshot: SAMPLE_POLICY_TEXT,
};

const SNEAKERS: OrderItem = {
  id: "item-sneakers",
  name: "White Everyday Sneakers",
  sku: "WS-001",
  price: 185,
  quantity: 1,
};

const HOODIE: OrderItem = {
  id: "item-hoodie",
  name: "Olive Cotton Hoodie",
  sku: "HD-014",
  price: 220,
  quantity: 2,
};

const FINAL_SALE_ITEM: OrderItem = {
  id: "item-final-sale",
  name: "Clearance Backpack",
  sku: "FS-099",
  price: 95,
  quantity: 1,
};

export const ORDER_ELIGIBLE: DeliveryFacts = {
  orderId: "SA-10492",
  orderDate: "2026-09-04T08:00:00+03:00",
  deliveryDate: "2026-09-10T14:00:00+03:00",
  orderStatus: "delivered",
  customerEmail: "sara.ahmed@example.com",
  customerName: "Sara Ahmed",
  items: [SNEAKERS, HOODIE],
  currency: "SAR",
};

export const ORDER_EXPIRED: DeliveryFacts = {
  orderId: "SA-10331",
  orderDate: "2026-08-10T08:00:00+03:00",
  deliveryDate: "2026-08-15T14:00:00+03:00",
  orderStatus: "delivered",
  customerEmail: "khalid.othman@example.com",
  customerName: "Khalid Othman",
  items: [SNEAKERS],
  currency: "SAR",
};

export const ORDER_MISSING_DELIVERY: DeliveryFacts = {
  orderId: "SA-10567",
  orderDate: "2026-09-12T08:00:00+03:00",
  deliveryDate: null,
  orderStatus: "shipped",
  customerEmail: "noura.salem@example.com",
  customerName: "Noura Salem",
  items: [HOODIE],
  currency: "SAR",
};

export const ORDER_EXCLUDED_ITEM: DeliveryFacts = {
  orderId: "SA-10601",
  orderDate: "2026-09-08T08:00:00+03:00",
  deliveryDate: "2026-09-13T14:00:00+03:00",
  orderStatus: "delivered",
  customerEmail: "fahad.ali@example.com",
  customerName: "Fahad Ali",
  items: [FINAL_SALE_ITEM],
  currency: "SAR",
};

export const ALL_ORDERS: DeliveryFacts[] = [
  ORDER_ELIGIBLE,
  ORDER_EXPIRED,
  ORDER_MISSING_DELIVERY,
  ORDER_EXCLUDED_ITEM,
];

export const DRAFT_POLICY: PolicyDraft = {
  id: "draft-001",
  name: "Returns Policy — Draft",
  sourceText: SAMPLE_POLICY_TEXT,
  rules: SAMPLE_POLICY_RULES.map((r) => ({
    ...r,
    approvalState: "pending" as const,
  })),
  extractionState: "ready",
  createdAt: "2026-09-14T10:00:00+03:00",
  updatedAt: "2026-09-16T09:00:00+03:00",
};

export const SEED_CASES: ReturnCase[] = [
  {
    id: "case-001",
    orderId: "SA-10492",
    customerName: "Sara Ahmed",
    customerEmail: "sara.ahmed@example.com",
    itemId: "item-sneakers",
    itemName: "White Everyday Sneakers",
    quantity: 1,
    reason: "defective",
    condition: "new_unopened",
    outcome: "ELIGIBLE",
    caseStatus: "OPEN",
    decision: {
      outcome: "ELIGIBLE",
      reasonCodes: ["WITHIN_WINDOW", "REASON_ALLOWED", "CONDITION_ALLOWED", "ITEM_NOT_EXCLUDED", "ORDER_STATUS_OK", "QUANTITY_OK"],
      explanation: "This item qualifies for return. All policy conditions are met.",
      appliedRules: [],
      policyVersionId: "pol-v1-001",
      policyVersionLabel: "v1.0",
      evaluatedAt: "2026-09-16T09:15:00+03:00",
      relevantFacts: [],
      deadline: "2026-09-24T14:00:00+03:00",
    },
    createdAt: "2026-09-16T09:15:00+03:00",
    updatedAt: "2026-09-16T09:15:00+03:00",
    events: [
      { id: "ev-1", type: "verification", actor: "customer", timestamp: "2026-09-16T09:12:00+03:00", description: "Customer verified order access" },
      { id: "ev-2", type: "evaluation", actor: "system", timestamp: "2026-09-16T09:15:00+03:00", description: "Eligibility evaluated: ELIGIBLE" },
      { id: "ev-3", type: "case_created", actor: "customer", timestamp: "2026-09-16T09:15:00+03:00", description: "Return case created" },
    ],
    notes: [],
  },
  {
    id: "case-002",
    orderId: "SA-10567",
    customerName: "Noura Salem",
    customerEmail: "noura.salem@example.com",
    itemId: "item-hoodie",
    itemName: "Olive Cotton Hoodie",
    quantity: 1,
    reason: "not_as_described",
    condition: "opened_unused",
    outcome: "MANUAL_REVIEW",
    caseStatus: "OPEN",
    decision: {
      outcome: "MANUAL_REVIEW",
      reasonCodes: ["MISSING_DELIVERY_DATE"],
      explanation: "The delivery date is not available, so the return window cannot be calculated. Your store needs to take a closer look.",
      appliedRules: [],
      policyVersionId: "pol-v1-001",
      policyVersionLabel: "v1.0",
      evaluatedAt: "2026-09-16T08:30:00+03:00",
      relevantFacts: [],
    },
    createdAt: "2026-09-16T08:30:00+03:00",
    updatedAt: "2026-09-16T08:30:00+03:00",
    events: [
      { id: "ev-4", type: "verification", actor: "customer", timestamp: "2026-09-16T08:28:00+03:00", description: "Customer verified order access" },
      { id: "ev-5", type: "evaluation", actor: "system", timestamp: "2026-09-16T08:30:00+03:00", description: "Eligibility evaluated: MANUAL_REVIEW" },
      { id: "ev-6", type: "case_created", actor: "customer", timestamp: "2026-09-16T08:30:00+03:00", description: "Return case created" },
    ],
    notes: [],
  },
  {
    id: "case-003",
    orderId: "SA-10331",
    customerName: "Khalid Othman",
    customerEmail: "khalid.othman@example.com",
    itemId: "item-sneakers",
    itemName: "White Everyday Sneakers",
    quantity: 1,
    reason: "changed_mind",
    condition: "new_unopened",
    outcome: "NOT_ELIGIBLE",
    caseStatus: "RESOLVED",
    decision: {
      outcome: "NOT_ELIGIBLE",
      reasonCodes: ["OUTSIDE_WINDOW", "REASON_NOT_ALLOWED"],
      explanation: "This item is outside the return policy: return window — 32 days since delivery (window: 14 days).",
      appliedRules: [],
      policyVersionId: "pol-v1-001",
      policyVersionLabel: "v1.0",
      evaluatedAt: "2026-09-15T14:00:00+03:00",
      relevantFacts: [],
    },
    createdAt: "2026-09-15T14:00:00+03:00",
    updatedAt: "2026-09-16T10:00:00+03:00",
    events: [
      { id: "ev-7", type: "verification", actor: "customer", timestamp: "2026-09-15T13:58:00+03:00", description: "Customer verified order access" },
      { id: "ev-8", type: "evaluation", actor: "system", timestamp: "2026-09-15T14:00:00+03:00", description: "Eligibility evaluated: NOT_ELIGIBLE" },
      { id: "ev-9", type: "case_created", actor: "customer", timestamp: "2026-09-15T14:00:00+03:00", description: "Return case created" },
      { id: "ev-10", type: "status_change", actor: "merchant", timestamp: "2026-09-16T10:00:00+03:00", description: "Case marked as resolved" },
    ],
    notes: [
      { id: "note-1", author: "Operations", content: "Customer was notified that the return window has passed.", createdAt: "2026-09-16T10:00:00+03:00" },
    ],
  },
];

export const SALLA_CONNECTION: PlatformConnection = {
  platformId: "salla",
  platformName: "Salla",
  state: "connected",
  connectedAt: "2026-09-01T08:00:00+03:00",
  lastSyncAt: "2026-09-16T09:45:00+03:00",
  storeName: "Nova Store",
  isSimulated: true,
  available: true,
};

export const ZID_CONNECTION: PlatformConnection = {
  platformId: "zid",
  platformName: "Zid",
  state: "disconnected",
  isSimulated: false,
  available: false,
};

export const DEMO_CREDENTIALS = {
  orderNumber: "SA-10492",
  email: "sara.ahmed@example.com",
};
