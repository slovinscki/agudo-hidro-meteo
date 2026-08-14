const { coletarEPersistir } = require("./plugfield");

module.exports = async function handler(requisicao, resposta) {
  if (requisicao.method !== "GET") {
    resposta.setHeader("Allow", "GET");
    return resposta.status(405).json({ erro: "Método não permitido." });
  }
  const segredo = process.env.CRON_SECRET;
  if (!segredo || requisicao.headers?.authorization !== `Bearer ${segredo}`) {
    return resposta.status(401).json({ erro: "Não autorizado." });
  }
  try {
    const resultado = await coletarEPersistir();
    return resposta.status(200).json({
      ok: true,
      medidoEm: resultado.medicao.medidoEm,
      quantidadeInserida: resultado.quantidadeInserida,
    });
  } catch (erro) {
    console.error("Falha na coleta Plugfield:", erro.message);
    return resposta.status(502).json({ ok: false, erro: "A coleta Plugfield falhou." });
  }
};
