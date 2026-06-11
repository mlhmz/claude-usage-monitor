export type TokenCounts = {
  readonly input: number;
  readonly output: number;
  readonly cacheWrite: number;
  readonly cacheRead: number;
};

export type UsageRecord = TokenCounts & {
  readonly date: string;
  readonly project: string;
  readonly model: string;
};

export type AggregatedRow = UsageRecord & {
  readonly messages: number;
};

export type Bucket = TokenCounts & {
  readonly key: string;
  readonly messages: number;
};

export type ViewKind = "date" | "project" | "model";

export const ZERO_TOKENS: TokenCounts = Object.freeze({
  input: 0,
  output: 0,
  cacheWrite: 0,
  cacheRead: 0,
});
