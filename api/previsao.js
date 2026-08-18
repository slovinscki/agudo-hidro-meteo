const { obterPrevisaoMaisRecente } = require("../lib/repositorio-previsao");

module.exports = async function handler(requisicao, resposta) {
  if (requisicao.method !== "GET") {
    resposta.setHeader("Allow", "GET");
    return resposta.status(405).json({ erro: "Método não permitido." });
  }
  try {
    const previsao = await obterPrevisaoMaisRecente("agudo-rs");
    if (!previsao) return resposta.status(503).json({ erro: "Previsão ainda não armazenada." });
    const idadeMinutos = Math.max(0, (Date.now() - new Date(previsao.emitidoEm).getTime()) / 60000);
    resposta.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
    return resposta.status(200).json({
      ...previsao,
      atualizacao: { idadeMinutos, situacao: idadeMinutos > 90 ? "desatualizada" : "atualizada" },
    });
  } catch (erro) {
    console.error("Erro ao consultar previsão armazenada:", erro.message);
    return resposta.status(503).json({ erro: "Previsão meteorológica indisponível." });
  }
};
