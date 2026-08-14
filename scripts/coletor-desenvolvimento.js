const fs = require("node:fs");
const path = require("node:path");

const INTERVALO_PADRAO_MINUTOS = 15;

const caminhoEnv = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(caminhoEnv)) {
  for (const linha of fs.readFileSync(caminhoEnv, "utf8").split(/\r?\n/)) {
    const correspondencia = linha.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!correspondencia) continue;
    process.env[correspondencia[1]] = correspondencia[2]
      .trim()
      .replace(/^"|"$/g, "");
  }
}

const { coletarEPersistir: coletarAna } = require("../api/ana");
const { coletarEPersistir: coletarPlugfield } = require("../api/plugfield");

function inteiroPositivo(valor, padrao) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : padrao;
}

const continuo = process.argv.includes("--continuo");
const intervaloMinutos = inteiroPositivo(
  process.env.INTERVALO_COLETA_MINUTOS,
  INTERVALO_PADRAO_MINUTOS,
);

async function executarCiclo() {
  const iniciadoEm = new Date();
  console.log(`[${iniciadoEm.toISOString()}] Iniciando coleta de desenvolvimento.`);

  const resultados = await Promise.allSettled([
    coletarAna(),
    coletarPlugfield(),
  ]);

  resultados.forEach((resultado, indice) => {
    const fonte = indice === 0 ? "ANA" : "Plugfield";
    if (resultado.status === "fulfilled") {
      console.log(`${fonte}: sucesso`, resultado.value);
    } else {
      console.error(`${fonte}: erro — ${resultado.reason.message}`);
    }
  });

  if (resultados.every((resultado) => resultado.status === "rejected")) {
    process.exitCode = 1;
  }
}

async function iniciar() {
  await executarCiclo();

  if (!continuo) return;

  console.log(`Próxima coleta em ${intervaloMinutos} minutos.`);
  setInterval(executarCiclo, intervaloMinutos * 60 * 1000);
}

iniciar().catch((erro) => {
  console.error("Coletor de desenvolvimento falhou:", erro.message);
  process.exitCode = 1;
});
