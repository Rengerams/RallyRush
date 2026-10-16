import { mergeConfig } from "vite";
import appConfig from "../../frontend/vite.config.mjs";
import { fileURLToPath } from "node:url";

// A separate dev-only entry mounts production components with observable callbacks.
// It is not reachable from or included in the production application build.
export default mergeConfig(appConfig, {
  root: fileURLToPath(new URL("../..", import.meta.url)),
  server: { host: "127.0.0.1", port: 4174, strictPort: true },
});
