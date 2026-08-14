const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const raiz = path.join(__dirname, "..");
const env = { ...process.env };
const caminhoEnv = path.join(raiz, ".env.local");

if (fs.existsSync(caminhoEnv)) {
  for (const linha of fs.readFileSync(caminhoEnv, "utf8").split(/\r?\n/)) {
    const correspondencia = linha.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!correspondencia) continue;
    env[correspondencia[1]] = correspondencia[2]
      .trim()
      .replace(/^"|"$/g, "");
  }
}

const porta = env.DEV_PORT || "4173";
const processo = spawn(
  "npx.cmd",
  ["vercel", "dev", "--listen", `127.0.0.1:${porta}`, "--yes"],
  { cwd: raiz, env, shell: true, stdio: "inherit" },
);

processo.on("exit", (codigo) => {
  process.exitCode = codigo ?? 1;
});
