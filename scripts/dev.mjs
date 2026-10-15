import { spawn } from "node:child_process";
const children = [
  spawn(process.execPath, ["server/index.mjs"], { stdio: "inherit" }),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], {
    stdio: "inherit",
  }),
];
let closing = false;
function stop() {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill();
}
for (const child of children)
  child.on("exit", (code) => {
    stop();
    process.exitCode = code || 0;
  });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, stop);
