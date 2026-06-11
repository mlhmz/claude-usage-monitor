import { aggregateRows } from "./aggregate.ts";
import { CONFIG } from "./config.ts";
import { scanSessions, type ScanResult } from "./sessions.ts";
import * as tui from "./tui.ts";
import { buildView, summarize } from "./views.ts";
import type { ViewKind } from "./types.ts";

type AppState = {
  scan: ScanResult;
  view: ViewKind;
};

const KEY_BINDINGS: Record<string, ViewKind | "reload" | "quit"> = {
  d: "date",
  p: "project",
  m: "model",
  r: "reload",
  q: "quit",
  CTRL_C: "quit",
  ESCAPE: "quit",
};

async function loadState(view: ViewKind): Promise<AppState> {
  const scan = await scanSessions(CONFIG.projectsDir);
  return { scan, view };
}

function render(state: AppState): void {
  const rows = aggregateRows(state.scan.records);
  tui.clear();
  tui.renderHeader(summarize(rows));
  tui.renderScanStats(
    state.scan.stats.linesRead,
    state.scan.stats.uniqueMessages,
    state.scan.stats.filesScanned,
  );
  tui.renderTable(buildView(state.view, rows));
  tui.renderFooter();
}

export async function run(): Promise<void> {
  tui.clear();
  tui.info(`Loading sessions from ${CONFIG.projectsDir}...`);

  let state = await loadState(CONFIG.defaultView);
  render(state);

  await new Promise<void>((resolve) => {
    const detach = tui.onKey(async (key) => {
      const action = KEY_BINDINGS[key];
      if (!action) return;
      if (action === "quit") {
        detach();
        resolve();
        return;
      }
      if (action === "reload") {
        tui.clear();
        tui.info("Reloading...");
        state = await loadState(state.view);
      } else {
        state = { ...state, view: action };
      }
      render(state);
    });
  });
}
