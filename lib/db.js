const { neon } = require("@neondatabase/serverless");

let cliente = null;

function bancoConfigurado() {
  return Boolean(process.env.DATABASE_URL);
}

function obterBanco() {
  if (!bancoConfigurado()) {
    throw new Error("DATABASE_URL não configurada.");
  }

  if (!cliente) {
    cliente = neon(process.env.DATABASE_URL);
  }

  return cliente;
}

module.exports = { bancoConfigurado, obterBanco };
