import type { TokenCounts } from "./types.ts";

type PricePer1M = {
  readonly input: number;
  readonly output: number;
  readonly cacheWrite: number;
  readonly cacheRead: number;
};

const PRICE_TABLE: ReadonlyArray<readonly [pattern: string, price: PricePer1M]> = [
  ["claude-opus-4", { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 }],
  ["claude-sonnet-4", { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 }],
  ["claude-haiku-4", { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 }],
  ["claude-3-5-haiku", { input: 0.8, output: 4, cacheWrite: 1, cacheRead: 0.08 }],
  ["claude-3-5-sonnet", { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 }],
  ["claude-3-opus", { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 }],
];

function priceFor(model: string): PricePer1M | null {
  const hit = PRICE_TABLE.find(([pattern]) => model.includes(pattern));
  return hit ? hit[1] : null;
}

export function estimateCost(model: string, tokens: TokenCounts): number | null {
  const price = priceFor(model);
  if (!price) return null;
  const total =
    tokens.input * price.input +
    tokens.output * price.output +
    tokens.cacheWrite * price.cacheWrite +
    tokens.cacheRead * price.cacheRead;
  return total / 1_000_000;
}

export function isPriced(model: string): boolean {
  return priceFor(model) !== null;
}
