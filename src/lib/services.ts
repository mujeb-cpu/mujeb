import {
  type DeliveryFacts,
  type EligibilityDecision,
  type ReturnCase,
  type PlatformConnection,
  type PolicyDraft,
  type PolicyVersion,
  type PolicyRule,
  type CaseStatus,
  type CaseNote,
  type ReturnReason,
  type ItemCondition,
  DEMO_CLOCK,
} from "./domain";
import { evaluateEligibility } from "./engine";
import {
  ALL_ORDERS,
  SAMPLE_POLICY_TEXT,
  SAMPLE_POLICY_RULES,
} from "./fixtures";

const STORAGE_KEY = "mujeeb-workspace-state-v1";

interface DemoState {
  cases: ReturnCase[];
  publishedPolicy: PolicyVersion | null;
  publishedVersions: PolicyVersion[];
  drafts: PolicyDraft[];
  connections: PlatformConnection[];
  storeName: string;
  isOnboarded: boolean;
}

function loadState(): DemoState {
  if (typeof localStorage === "undefined") {
    return defaultState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as DemoState;
    if (!parsed.cases || !parsed.connections) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function defaultState(): DemoState {
  return {
    cases: [],
    publishedPolicy: null,
    publishedVersions: [],
    drafts: [],
    connections: [],
    storeName: "My Store",
    isOnboarded: false,
  };
}

function saveState(state: DemoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export const services = {
  getPublishedPolicy(): PolicyVersion | null {
    return loadState().publishedPolicy;
  },

  getPublishedVersions(): PolicyVersion[] {
    const state = loadState();
    return state.publishedVersions ?? (state.publishedPolicy ? [state.publishedPolicy] : []);
  },

  testConnection(platformId: string): { ok: boolean; latencyMs: number; message: string } {
    const state = loadState();
    const conn = state.connections.find((c) => c.platformId === platformId);
    if (!conn || conn.state !== "connected") {
      return { ok: false, latencyMs: 0, message: "Not connected" };
    }
    const latency = Math.floor(Math.random() * 80) + 20;
    conn.lastSyncAt = DEMO_CLOCK.now.toISOString();
    saveState(state);
    return { ok: true, latencyMs: latency, message: `Synced in ${latency}ms` };
  },

  getDrafts(): PolicyDraft[] {
    return loadState().drafts ?? [];
  },

  getDraft(id: string): PolicyDraft | undefined {
    return loadState().drafts.find((d) => d.id === id);
  },

  createDraft(name: string, sourceText: string): PolicyDraft {
    const state = loadState();
    const draft: PolicyDraft = {
      id: uid("draft"),
      name,
      sourceText,
      rules: [],
      extractionState: "idle",
      createdAt: DEMO_CLOCK.now.toISOString(),
      updatedAt: DEMO_CLOCK.now.toISOString(),
    };
    state.drafts = [draft, ...state.drafts];
    saveState(state);
    return draft;
  },

  async simulateExtraction(draftId: string): Promise<PolicyRule[]> {
    const state = loadState();
    const draft = state.drafts.find((d) => d.id === draftId);
    if (!draft) throw new Error("Draft not found");

    draft.extractionState = "reading";
    draft.updatedAt = DEMO_CLOCK.now.toISOString();
    saveState(state);

    await delay(800);

    draft.extractionState = "proposing";
    saveState(state);

    await delay(1200);

    const rules = SAMPLE_POLICY_RULES.map((r) => ({
      ...r,
      id: uid("rule"),
      approvalState: "pending" as const,
    }));

    draft.extractionState = "ready";
    draft.rules = rules;
    draft.updatedAt = DEMO_CLOCK.now.toISOString();
    saveState(state);

    return rules;
  },

  updateRule(draftId: string, ruleId: string, updates: Partial<PolicyRule>): void {
    const state = loadState();
    const draft = state.drafts.find((d) => d.id === draftId);
    if (!draft) return;
    const rule = draft.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    Object.assign(rule, updates);
    if (updates.value !== undefined && rule.creator === "ai") {
      rule.approvalState = "edited";
    }
    draft.updatedAt = DEMO_CLOCK.now.toISOString();
    saveState(state);
  },

  setRuleApproval(draftId: string, ruleId: string, approvalState: PolicyRule["approvalState"]): void {
    const state = loadState();
    const draft = state.drafts.find((d) => d.id === draftId);
    if (!draft) return;
    const rule = draft.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    rule.approvalState = approvalState;
    draft.updatedAt = DEMO_CLOCK.now.toISOString();
    saveState(state);
  },

  addManualRule(draftId: string, rule: Omit<PolicyRule, "id" | "creator" | "approvalState">): void {
    const state = loadState();
    const draft = state.drafts.find((d) => d.id === draftId);
    if (!draft) return;
    draft.rules.push({
      ...rule,
      id: uid("rule"),
      creator: "merchant",
      approvalState: "approved",
    });
    draft.updatedAt = DEMO_CLOCK.now.toISOString();
    saveState(state);
  },

  publishDraft(draftId: string, publisher: string): PolicyVersion | null {
    const state = loadState();
    const draft = state.drafts.find((d) => d.id === draftId);
    if (!draft) return null;
    const unresolved = draft.rules.some((r) => r.approvalState === "pending" || r.approvalState === "rejected");
    if (unresolved) return null;

    const versionNumber = state.publishedPolicy
      ? incrementVersion(state.publishedPolicy.versionLabel)
      : "v1.0";

    const version: PolicyVersion = {
      id: uid("pol"),
      versionLabel: versionNumber,
      publishedAt: DEMO_CLOCK.now.toISOString(),
      publishedBy: publisher,
      rules: draft.rules.map((r) => ({ ...r })),
      sourceText: draft.sourceText,
      frozenSnapshot: draft.sourceText,
    };

    state.publishedPolicy = version;
    state.publishedVersions = [...(state.publishedVersions ?? []), version];
    state.drafts = state.drafts.filter((d) => d.id !== draftId);
    saveState(state);
    return version;
  },

  verifyOrder(orderNumber: string, emailOrMobile: string): DeliveryFacts | null {
    const order = ALL_ORDERS.find(
      (o) =>
        o.orderId.toLowerCase() === orderNumber.trim().toLowerCase() &&
        o.customerEmail.toLowerCase() === emailOrMobile.trim().toLowerCase(),
    );
    return order ?? null;
  },

  evaluate(
    facts: DeliveryFacts,
    itemId: string,
    quantity: number,
    reason: ReturnReason,
    condition: ItemCondition,
  ): EligibilityDecision | null {
    const policy = loadState().publishedPolicy;
    if (!policy) return null;
    return evaluateEligibility({
      policyVersion: policy,
      facts,
      itemId,
      quantity,
      reason,
      condition,
    });
  },

  createCase(
    facts: DeliveryFacts,
    itemId: string,
    quantity: number,
    reason: ReturnReason,
    condition: ItemCondition,
    decision: EligibilityDecision,
  ): ReturnCase {
    const state = loadState();
    const item = facts.items.find((i) => i.id === itemId);
    const now = DEMO_CLOCK.now.toISOString();

    const newCase: ReturnCase = {
      id: uid("case"),
      orderId: facts.orderId,
      customerName: facts.customerName,
      customerEmail: facts.customerEmail,
      itemId,
      itemName: item?.name ?? "Unknown item",
      quantity,
      reason,
      condition,
      outcome: decision.outcome,
      caseStatus: "OPEN",
      decision,
      createdAt: now,
      updatedAt: now,
      events: [
        { id: uid("ev"), type: "verification", actor: "customer", timestamp: now, description: "Customer verified order access" },
        { id: uid("ev"), type: "evaluation", actor: "system", timestamp: now, description: `Eligibility evaluated: ${decision.outcome}` },
        { id: uid("ev"), type: "case_created", actor: "customer", timestamp: now, description: "Return case created" },
      ],
      notes: [],
    };

    state.cases = [newCase, ...state.cases];
    saveState(state);
    return newCase;
  },

  getCases(): ReturnCase[] {
    return loadState().cases;
  },

  getCase(id: string): ReturnCase | undefined {
    return loadState().cases.find((c) => c.id === id);
  },

  updateCaseStatus(caseId: string, status: CaseStatus, actor: string): ReturnCase | undefined {
    const state = loadState();
    const c = state.cases.find((c) => c.id === caseId);
    if (!c) return undefined;
    const validTransitions: Record<CaseStatus, CaseStatus[]> = {
      OPEN: ["AWAITING_ITEM", "RESOLVED", "CANCELLED"],
      AWAITING_ITEM: ["RECEIVED", "CANCELLED"],
      RECEIVED: ["RESOLVED"],
      RESOLVED: [],
      CANCELLED: [],
    };
    if (!validTransitions[c.caseStatus].includes(status)) return undefined;

    c.caseStatus = status;
    c.updatedAt = DEMO_CLOCK.now.toISOString();
    c.events.push({
      id: uid("ev"),
      type: "status_change",
      actor: actor === "merchant" ? "merchant" : "system",
      timestamp: c.updatedAt,
      description: `Case status changed to ${status}`,
    });
    saveState(state);
    return c;
  },

  addNote(caseId: string, author: string, content: string): CaseNote | undefined {
    const state = loadState();
    const c = state.cases.find((c) => c.id === caseId);
    if (!c) return undefined;
    const note: CaseNote = {
      id: uid("note"),
      author,
      content,
      createdAt: DEMO_CLOCK.now.toISOString(),
    };
    c.notes.push(note);
    c.events.push({
      id: uid("ev"),
      type: "note",
      actor: "merchant",
      timestamp: note.createdAt,
      description: `Note added: ${content.slice(0, 60)}${content.length > 60 ? "…" : ""}`,
    });
    c.updatedAt = note.createdAt;
    saveState(state);
    return note;
  },

  getConnections(): PlatformConnection[] {
    return loadState().connections;
  },

  async connectPlatform(platformId: string): Promise<PlatformConnection> {
    const state = loadState();
    const conn = state.connections.find((c) => c.platformId === platformId);
    if (!conn || !conn.available) throw new Error("Platform not available");

    conn.state = "connecting";
    saveState(state);

    await delay(1500);

    conn.state = "connected";
    conn.connectedAt = DEMO_CLOCK.now.toISOString();
    conn.storeName = state.storeName;
    saveState(state);
    return conn;
  },

  async disconnectPlatform(platformId: string): Promise<void> {
    const state = loadState();
    const conn = state.connections.find((c) => c.platformId === platformId);
    if (!conn) return;
    conn.state = "disconnected";
    conn.connectedAt = undefined;
    saveState(state);
  },

  getStoreName(): string {
    return loadState().storeName;
  },

  setStoreName(name: string): void {
    const state = loadState();
    state.storeName = name;
    saveState(state);
  },

  isOnboarded(): boolean {
    return loadState().isOnboarded;
  },

  setOnboarded(value: boolean): void {
    const state = loadState();
    state.isOnboarded = value;
    saveState(state);
  },

  resetDemo(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  getSamplePolicyText(): string {
    return SAMPLE_POLICY_TEXT;
  },

  getSampleRules(): PolicyRule[] {
    return SAMPLE_POLICY_RULES;
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function incrementVersion(label: string): string {
  const match = label.match(/v(\d+)\.(\d+)/);
  if (!match) return "v1.0";
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  return minor === 9 ? `v${major + 1}.0` : `v${major}.${minor + 1}`;
}
