const INMET_AVISOS_URL = "https://apiprevmet3.inmet.gov.br/avisos/ativos";
const CODIGO_IBGE_AGUDO = "4300109";
const TIMEOUT_INMET_MS = 8000;

function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function primeiro(objeto, nomes) {
  for (const nome of nomes) {
    const valor = objeto?.[nome];
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }
  return null;
}

function contemCodigoMunicipio(valor, codigo) {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === "string" || typeof valor === "number") {
    return String(valor).includes(codigo);
  }
  if (Array.isArray(valor)) {
    return valor.some((item) => contemCodigoMunicipio(item, codigo));
  }
  if (typeof valor === "object") {
    return Object.values(valor).some((item) =>
      contemCodigoMunicipio(item, codigo),
    );
  }
  return false;
}

function extrairAvisos(payload) {
  if (Array.isArray(payload)) return payload;
  for (const chave of ["avisos", "items", "features", "data"]) {
    if (Array.isArray(payload?.[chave])) return payload[chave];
  }
  return [];
}

function normalizarAviso(item) {
  const aviso = item?.properties ?? item;
  const id = primeiro(aviso, ["id", "aviso_id", "identifier", "codigo"]);
  const inicio = primeiro(aviso, ["inicio", "onset", "effective", "start"]);
  const fim = primeiro(aviso, ["fim", "expires", "expiration", "end"]);
  const evento = primeiro(aviso, ["evento", "event", "aviso", "titulo", "headline"]);
  const severidade = primeiro(aviso, ["severidade", "severity", "nivel", "grau"]);

  return {
    id: id === null ? null : String(id),
    evento: texto(evento) || "Aviso meteorológico",
    severidade: texto(severidade) || "Severidade não informada",
    inicio,
    fim,
    riscos: texto(
      primeiro(aviso, ["riscos", "descricao", "description", "descritivo"]),
    ),
    instrucoes: texto(
      primeiro(aviso, ["instrucoes", "instruction", "recomendacoes"]),
    ),
    url: id ? `https://avisos.inmet.gov.br/${id}` : "https://avisos.inmet.gov.br/",
  };
}

module.exports = async function handler(requisicao, resposta) {
  if (requisicao.method !== "GET") {
    resposta.setHeader("Allow", "GET");
    return resposta.status(405).json({ erro: "Método não permitido." });
  }

  try {
    const retorno = await fetch(INMET_AVISOS_URL, {
      signal: AbortSignal.timeout(TIMEOUT_INMET_MS),
      headers: {
        Accept: "application/json",
        "User-Agent": "Agudo-Hidro-Meteo/1.0 (dados publicos; contato via repositorio)",
      },
    });

    if (!retorno.ok) {
      throw new Error(`INMET respondeu HTTP ${retorno.status}.`);
    }

    const payload = await retorno.json();
    const avisos = extrairAvisos(payload)
      .filter((aviso) => contemCodigoMunicipio(aviso, CODIGO_IBGE_AGUDO))
      .map(normalizarAviso)
      .sort((a, b) => new Date(a.fim ?? 0) - new Date(b.fim ?? 0));

    resposta.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return resposta.status(200).json({
      municipio: { nome: "Agudo", uf: "RS", codigoIbge: CODIGO_IBGE_AGUDO },
      fonte: "Instituto Nacional de Meteorologia (INMET)",
      fonteUrl: "https://avisos.inmet.gov.br/",
      consultadoEm: new Date().toISOString(),
      avisos,
    });
  } catch (erro) {
    console.error("Erro na integração com o INMET:", erro.message);
    resposta.setHeader("Cache-Control", "no-store");
    return resposta.status(502).json({
      erro: "Não foi possível consultar os avisos do INMET.",
    });
  }
};

module.exports.extrairAvisos = extrairAvisos;
module.exports.contemCodigoMunicipio = contemCodigoMunicipio;
module.exports.normalizarAviso = normalizarAviso;
