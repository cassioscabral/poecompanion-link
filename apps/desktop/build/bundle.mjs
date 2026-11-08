// Adapted from Exiled Exchange 2 (MIT) — see NOTICE
// Bundles main + preload with esbuild (workspace packages are TS source, compiled in)
// and the renderer with Vite. Electron and electron-updater stay external.
import { build } from "esbuild";
import { build as viteBuild } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);

const common = { bundle: true, platform: "node", target: "node22", format: "cjs", sourcemap: true, logLevel: "info" };

await build({
  ...common,
  entryPoints: ["src/main/index.ts"],
  outfile: "dist/main.cjs",
  external: ["electron", "electron-updater"],
});
await build({
  ...common,
  entryPoints: ["src/preload/index.ts"],
  outfile: "dist/preload.cjs",
  external: ["electron"],
});
await viteBuild({ configFile: path.join(root, "vite.renderer.config.ts"), logLevel: "info" });

const { copyFileSync } = await import("node:fs");
copyFileSync("build/tray.png", "dist/tray.png");
