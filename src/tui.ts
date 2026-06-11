import tk from "terminal-kit";
import { formatCost, formatTokens } from "./format.ts";
import type { Summary, Table } from "./views.ts";

const term = tk.terminal;

const COLUMN_GAP = "  ";

export function clear(): void {
  term.clear();
}

export function info(message: string): void {
  term(message + "\n");
}

export function fatal(error: unknown): void {
  const msg = error instanceof Error ? error.stack ?? error.message : String(error);
  term.red(msg + "\n");
}

export function renderHeader(summary: Summary): void {
  term.bold.cyan("Claude Usage Monitor\n");
  const unpriced =
    summary.unpricedMessages > 0 ? ` (+${summary.unpricedMessages} unpriced msgs)` : "";
  term.gray(
    `${summary.days} days · ${summary.projects} projects · ${summary.messages} turns · ` +
      `${formatTokens(summary.tokens)} tokens · ~${formatCost(summary.cost)}${unpriced}\n`,
  );
}

export function renderScanStats(linesRead: number, uniqueMessages: number, files: number): void {
  term.gray(
    `(scanned ${linesRead} lines across ${files} files, ${uniqueMessages} unique messages)\n\n`,
  );
}

function columnWidths(table: Table): number[] {
  const widths = table.headers.map((h) => h.length);
  for (const row of table.rows) {
    row.forEach((cell, i) => {
      if (cell.length > widths[i]) widths[i] = cell.length;
    });
  }
  return widths;
}

function padCell(cell: string, width: number, leftAligned: boolean): string {
  return leftAligned ? cell.padEnd(width) : cell.padStart(width);
}

export function renderTable(table: Table): void {
  const widths = columnWidths(table);
  const headerLine = table.headers
    .map((h, i) => padCell(h, widths[i], i === 0))
    .join(COLUMN_GAP);
  term.bold.yellow(headerLine + "\n");
  for (const row of table.rows) {
    const line = row.map((cell, i) => padCell(cell, widths[i], i === 0)).join(COLUMN_GAP);
    term(line + "\n");
  }
}

export function renderFooter(): void {
  term("\n");
  term.gray("[d] Date   [p] Project   [m] Model   [r] Reload   [q] Quit\n");
}

export type KeyHandler = (key: string) => void | Promise<void>;

export function onKey(handler: KeyHandler): () => void {
  term.grabInput({});
  const listener = (name: string) => void handler(name);
  term.on("key", listener);
  return () => {
    term.off("key", listener);
    term.grabInput(false);
  };
}
