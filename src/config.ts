import * as os from "node:os";
import * as path from "node:path";

export const CONFIG = Object.freeze({
  projectsDir: path.join(os.homedir(), ".claude", "projects"),
  defaultView: "date" as const,
});
