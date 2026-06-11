import { run } from "./app.ts";
import * as tui from "./tui.ts";

run()
  .then(() => process.exit(0))
  .catch((err) => {
    tui.fatal(err);
    process.exit(1);
  });
