const { spawn } = require("child_process");
const port = String(process.env.PORT || 4173);
const child = spawn("node", [require.resolve("next/dist/bin/next"), "start", "-p", port], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code || 0));
