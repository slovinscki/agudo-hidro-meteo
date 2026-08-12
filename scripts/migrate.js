const fs = require("node:fs");
const path = require("node:path");
const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  throw new Error("Defina DATABASE_URL antes de executar a migração.");
}

const sql = neon(process.env.DATABASE_URL);
const diretorio = path.join(__dirname, "..", "db", "migrations");
const arquivos = fs
  .readdirSync(diretorio)
  .filter((arquivo) => arquivo.endsWith(".sql"))
  .sort();

async function executar() {
  for (const arquivo of arquivos) {
    const conteudo = fs.readFileSync(path.join(diretorio, arquivo), "utf8");
    console.log(`Executando ${arquivo}...`);
    const comandos = conteudo
      .split(/;\s*(?:\r?\n|$)/)
      .map((comando) => comando.trim())
      .filter(Boolean);

    for (const comando of comandos) {
      await sql.query(comando);
    }
  }
  console.log("Migrações concluídas.");
}

executar().catch((erro) => {
  console.error("Falha na migração:", erro.message);
  process.exitCode = 1;
});
