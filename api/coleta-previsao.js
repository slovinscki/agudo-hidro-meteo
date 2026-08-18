const { coletarPrevisao } = require("../lib/servico-previsao");

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
    const resultado = await coletarPrevisao();
    return resposta.status(200).json({
      ok: true,
      fonte: resultado.previsao.fonte.nome,
      emitidoEm: resultado.previsao.emitidoEm,
      contingencia: resultado.contingencia,
      quantidadeInserida: resultado.quantidadeInserida,
    });
  } catch (erro) {
    console.error("Falha na coleta da previsão:", erro.message);
    return resposta.status(502).json({ ok: false, erro: "A coleta da previsão falhou." });
  }
};
