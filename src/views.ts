import { bucketBy } from "./aggregate.ts";
import { estimateCost } from "./pricing.ts";
import { formatCost, formatTokens, totalTokens, truncateLeft } from "./format.ts";
import type { AggregatedRow, ViewKind, TokenCounts } from "./types.ts";

export type Table = {
  readonly headers: ReadonlyArray<string>;
  readonly rows: ReadonlyArray<ReadonlyArray<string>>;
};

export type Summary = {
  readonly days: number;
  readonly projects: number;
  readonly messages: number;
  readonly tokens: number;
  readonly cost: number;
  readonly unpricedMessages: number;
};

const TOKEN_HEADERS = ["Msgs", "In", "Out", "CacheW", "CacheR", "Total", "Cost~"] as const;

function tokenCells(b: TokenCounts & { messages: number }, cost: number | null): string[] {
  return [
    String(b.messages),
    formatTokens(b.input),
    formatTokens(b.output),
    formatTokens(b.cacheWrite),
    formatTokens(b.cacheRead),
    formatTokens(totalTokens(b)),
    formatCost(cost),
  ];
}

function costForRows(rows: ReadonlyArray<AggregatedRow>): number | null {
  let sum = 0;
  let anyPriced = false;
  for (const r of rows) {
    const c = estimateCost(r.model, r);
    if (c === null) continue;
    anyPriced = true;
    sum += c;
  }
  return anyPriced ? sum : null;
}

function buildTable(
  rows: ReadonlyArray<AggregatedRow>,
  label: string,
  keyFn: (row: AggregatedRow) => string,
  sortFn: (a: { key: string; total: number }, b: { key: string; total: number }) => number,
  decorateKey: (key: string) => string = (k) => k,
): Table {
  const buckets = bucketBy(rows, keyFn)
    .map((b) => ({ ...b, total: totalTokens(b) }))
    .sort(sortFn);

  const dataRows = buckets.map((b) => {
    const matching = rows.filter((r) => keyFn(r) === b.key);
    return [decorateKey(b.key), ...tokenCells(b, costForRows(matching))];
  });

  return { headers: [label, ...TOKEN_HEADERS], rows: dataRows };
}

export function buildView(view: ViewKind, rows: ReadonlyArray<AggregatedRow>): Table {
  switch (view) {
    case "date":
      return buildTable(rows, "Date", (r) => r.date, (a, b) => a.key.localeCompare(b.key));
    case "project":
      return buildTable(
        rows,
        "Project",
        (r) => r.project,
        (a, b) => b.total - a.total,
        (key) => truncateLeft(key, 50),
      );
    case "model":
      return buildTable(rows, "Model", (r) => r.model, (a, b) => b.total - a.total);
  }
}

export function summarize(rows: ReadonlyArray<AggregatedRow>): Summary {
  const dates = new Set<string>();
  const projects = new Set<string>();
  let messages = 0;
  let tokens = 0;
  let cost = 0;
  let unpricedMessages = 0;
  for (const r of rows) {
    dates.add(r.date);
    projects.add(r.project);
    messages += r.messages;
    tokens += totalTokens(r);
    const c = estimateCost(r.model, r);
    if (c === null) unpricedMessages += r.messages;
    else cost += c;
  }
  return {
    days: dates.size,
    projects: projects.size,
    messages,
    tokens,
    cost,
    unpricedMessages,
  };
}
