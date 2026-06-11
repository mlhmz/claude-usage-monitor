import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import type { UsageRecord } from "./types.ts";

const ASSISTANT_TYPE = "assistant";

type RawUsage = {
  readonly input_tokens?: number;
  readonly output_tokens?: number;
  readonly cache_creation_input_tokens?: number;
  readonly cache_read_input_tokens?: number;
};

type RawAssistantLine = {
  readonly type?: string;
  readonly timestamp?: string;
  readonly message?: {
    readonly id?: string;
    readonly model?: string;
    readonly usage?: RawUsage;
  };
};

export type ScanStats = {
  readonly linesRead: number;
  readonly uniqueMessages: number;
  readonly filesScanned: number;
};

export type ScanResult = {
  readonly records: ReadonlyArray<UsageRecord>;
  readonly stats: ScanStats;
};

async function* walkJsonl(root: string): AsyncGenerator<string> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) yield* walkJsonl(full);
    else if (entry.isFile() && full.endsWith(".jsonl")) yield full;
  }
}

function projectNameFromDir(dir: string): string {
  // Claude Code encodes "/Users/x/Code/foo" as "-Users-x-Code-foo"
  const base = path.basename(dir);
  return base.startsWith("-") ? base.replace(/^-/, "/").replace(/-/g, "/") : base;
}

function parseUsageLine(
  line: string,
  project: string,
): { record: UsageRecord; messageId: string | null } | null {
  let raw: RawAssistantLine;
  try {
    raw = JSON.parse(line);
  } catch {
    return null;
  }
  if (raw.type !== ASSISTANT_TYPE) return null;
  const usage = raw.message?.usage;
  if (!usage) return null;

  const record: UsageRecord = {
    date: (raw.timestamp ?? "").slice(0, 10) || "unknown",
    project,
    model: raw.message?.model ?? "unknown",
    input: usage.input_tokens ?? 0,
    output: usage.output_tokens ?? 0,
    cacheWrite: usage.cache_creation_input_tokens ?? 0,
    cacheRead: usage.cache_read_input_tokens ?? 0,
  };
  return { record, messageId: raw.message?.id ?? null };
}

async function* readLines(file: string): AsyncGenerator<string> {
  const stream = fs.createReadStream(file, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) if (line) yield line;
}

export async function scanSessions(root: string): Promise<ScanResult> {
  const records: UsageRecord[] = [];
  const seenIds = new Set<string>();
  let linesRead = 0;
  let filesScanned = 0;

  for await (const file of walkJsonl(root)) {
    filesScanned++;
    const project = projectNameFromDir(path.dirname(file));
    for await (const line of readLines(file)) {
      linesRead++;
      const parsed = parseUsageLine(line, project);
      if (!parsed) continue;
      if (parsed.messageId) {
        if (seenIds.has(parsed.messageId)) continue;
        seenIds.add(parsed.messageId);
      }
      records.push(parsed.record);
    }
  }

  return {
    records,
    stats: { linesRead, uniqueMessages: seenIds.size, filesScanned },
  };
}
