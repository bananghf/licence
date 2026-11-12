const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const nextBin = require.resolve("next/dist/bin/next");
const port = String(process.env.PORT || 4173);
const root = path.join(__dirname, "..");

if (!fs.existsSync(path.join(root, ".next"))) {
  const built = spawnSync(process.execPath, [nextBin, "build"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (built.status) process.exit(built.status || 1);
}

const child = spawn(process.execPath, [nextBin, "start", "-p", port], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code || 0));
