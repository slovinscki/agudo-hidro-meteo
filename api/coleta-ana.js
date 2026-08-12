const { coletarEPersistir } = require("./ana");

module.exports = async function handler(requisicao, resposta) {
  if (requisicao.method !== "GET") {
    resposta.setHeader("Allow", "GET");
    return resposta.status(405).json({ erro: "Método não permitido." });
  }

  const segredo = process.env.CRON_SECRET;
  const autorizacao = requisicao.headers?.authorization;

  if (!segredo || autorizacao !== `Bearer ${segredo}`) {
    return resposta.status(401).json({ erro: "Não autorizado." });
  }

  try {
    const resultado = await coletarEPersistir();
    return resposta.status(200).json({
      ok: true,
      medidoEm: resultado.dados.medicao.medidoEm,
      persistencia: resultado.persistencia,
    });
  } catch (erro) {
    console.error("Falha na coleta agendada da ANA:", erro.message);
    return resposta.status(502).json({
      ok: false,
      erro: "A coleta da ANA falhou.",
    });
  }
};
