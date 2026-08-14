const URL_STATUS_DFESA = "https://www.dfesa.com.br/status/";
const TIMEOUT_DFESA_MS = 30000;

const LIMITES_VAZAO = {
  atencao: 3000,
  inundacao: 3500,
  unidade: "m³/s",
  fonte: "Boletim Rio Jacuí — Defesa Civil de Agudo, 14/08/2026 às 07:00",
  aplicacao: "Defluência da UHE Dona Francisca para avaliação a jusante",
  statusValidacao: "interpretação operacional pendente de confirmação técnica",
};

function numero(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const convertido = Number(String(valor).replace(",", "."));
  return Number.isFinite(convertido) ? convertido : null;
}

function dataHoraMedicao(item) {
  if (!item?.data || !item?.hora) return null;
  const instante = new Date(`${item.data}T${item.hora}-03:00`);
  return Number.isNaN(instante.getTime()) ? null : instante.toISOString();
}

function extrairSeries(html) {
  const correspondencia = html.match(
    /var\s+chart_vars\s*=\s*(\{[\s\S]*?\});/,
  );

  if (!correspondencia) {
    throw new Error("A página da DFESA não contém a série chart_vars.");
  }

  return JSON.parse(correspondencia[1]);
}

function normalizarMedicao(item) {
  return {
    medidoEm: dataHoraMedicao(item),
    nivelReservatorio: numero(item.cota),
    afluencia: numero(item.aflu),
    vazaoTurbinada: numero(item.turb),
    vazaoVertida: numero(item.vert),
    defluencia: numero(item.defl),
    nivelJusante: numero(item.jusant),
    chuva: numero(item.chuva),
    volumeUtilPercentual: numero(item.volult),
  };
}

function classificarDefluencia(defluencia) {
  if (typeof defluencia !== "number") return "indisponivel";
  if (defluencia >= LIMITES_VAZAO.inundacao) return "inundacao";
  if (defluencia >= LIMITES_VAZAO.atencao) return "atencao";
  return "normal";
}

function analisarBalanco(afluencia, defluencia) {
  if (typeof afluencia !== "number" || typeof defluencia !== "number") {
    return { diferenca: null, tendenciaArmazenamento: "indisponivel" };
  }

  const diferenca = afluencia - defluencia;
  const tolerancia = Math.max(10, Math.max(afluencia, defluencia) * 0.01);
  const tendenciaArmazenamento =
    Math.abs(diferenca) <= tolerancia
      ? "aproximadamente_estavel"
      : diferenca > 0
        ? "aumentando"
        : "diminuindo";

  return { diferenca, tendenciaArmazenamento };
}

async function consultarDfesa() {
  const resposta = await fetch(URL_STATUS_DFESA, {
    signal: AbortSignal.timeout(TIMEOUT_DFESA_MS),
    headers: { Accept: "text/html" },
  });

  if (!resposta.ok) {
    throw new Error(`Falha na consulta da DFESA: HTTP ${resposta.status}`);
  }

  const series = extrairSeries(await resposta.text());
  const historico24h = (Array.isArray(series.oneDay) ? series.oneDay : [])
    .map(normalizarMedicao)
    .filter((medicao) => medicao.medidoEm)
    .sort((a, b) => new Date(a.medidoEm) - new Date(b.medidoEm));
  const medicao = historico24h.at(-1);

  if (!medicao) {
    throw new Error("A DFESA não retornou medições horárias válidas.");
  }

  return {
    usina: {
      id: "usina-dona-francisca",
      nome: "UHE Dona Francisca",
    },
    fonte: "DFESA — Hidrologia",
    urlFonte: URL_STATUS_DFESA,
    naturezaIntegracao: "extração de dados estruturados incorporados à página pública",
    medicao,
    balanco: analisarBalanco(medicao.afluencia, medicao.defluencia),
    classificacaoDefluencia: classificarDefluencia(medicao.defluencia),
    limites: LIMITES_VAZAO,
    historico24h,
  };
}

module.exports = async function handler(requisicao, resposta) {
  if (requisicao.method !== "GET") {
    resposta.setHeader("Allow", "GET");
    return resposta.status(405).json({ erro: "Método não permitido." });
  }

  try {
    const dados = await consultarDfesa();
    resposta.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return resposta.status(200).json(dados);
  } catch (erro) {
    console.error("Falha na consulta da DFESA:", erro.message);
    return resposta.status(502).json({
      erro: "Os dados hidrológicos da DFESA estão indisponíveis.",
    });
  }
};

module.exports.consultarDfesa = consultarDfesa;
module.exports.extrairSeries = extrairSeries;
module.exports.classificarDefluencia = classificarDefluencia;
module.exports.analisarBalanco = analisarBalanco;
