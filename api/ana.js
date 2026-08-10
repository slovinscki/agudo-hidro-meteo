const ANA_API_URL =
  "https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas";

const DURACAO_TOKEN_MS = 55 * 60 * 1000;

let tokenEmCache = null;
let tokenExpiraEm = 0;

function obterVariavelObrigatoria(nome) {
  const valor = process.env[nome];

  if (!valor) {
    throw new Error(`Variável de ambiente ausente: ${nome}`);
  }

  return valor;
}

function converterNumero(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const numero = Number(String(valor).replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

function interpretarQualidade(codigo) {
  const qualidades = {
    "0": "ok",
    "1": "suspeito",
    "2": "ruim",
  };

  return qualidades[String(codigo)] ?? "nao_informado";
}

async function autenticar({ forcarNovoToken = false } = {}) {
  if (!forcarNovoToken && tokenEmCache && Date.now() < tokenExpiraEm) {
    return tokenEmCache;
  }

  const identificador = obterVariavelObrigatoria("ANA_IDENTIFICADOR");
  const senha = obterVariavelObrigatoria("ANA_SENHA");

  const resposta = await fetch(`${ANA_API_URL}/OAUth/v1`, {
    headers: {
      Accept: "application/json",
      Identificador: identificador,
      Senha: senha,
    },
  });

  if (!resposta.ok) {
    throw new Error(`Falha na autenticação da ANA: HTTP ${resposta.status}`);
  }

  const dados = await resposta.json();
  const token = dados?.items?.tokenautenticacao;

  if (!token) {
    throw new Error("A ANA não retornou um token de autenticação.");
  }

  tokenEmCache = token;
  tokenExpiraEm = Date.now() + DURACAO_TOKEN_MS;

  return token;
}

function criarUrlDaSerie() {
  const codigoEstacao = obterVariavelObrigatoria("ANA_ESTACAO");
  const url = new URL(
    `${ANA_API_URL}/HidroinfoanaSerieTelemetricaAdotada/v1`,
  );

  const dataDeBusca = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  // Estes nomes precisam ser idênticos aos publicados no OpenAPI da ANA.
  url.searchParams.set("Código da Estação", codigoEstacao);
  url.searchParams.set("Tipo Filtro Data", "DATA_LEITURA");
  url.searchParams.set("Data de Busca (yyyy-MM-dd)", dataDeBusca);
  url.searchParams.set("Range Intervalo de busca", "DIAS_30");

  return url;
}

async function consultarSerie(token) {
  return fetch(criarUrlDaSerie(), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

function encontrarMedicaoMaisRecente(medicoes) {
  return medicoes.reduce((maisRecente, medicao) => {
    if (!maisRecente) {
      return medicao;
    }

    return medicao.Data_Hora_Medicao > maisRecente.Data_Hora_Medicao
      ? medicao
      : maisRecente;
  }, null);
}

function normalizarMedicao(medicao) {
  const cotaCentimetros = converterNumero(medicao.Cota_Adotada);

  return {
    estacao: {
      id: "estacao-1",
      codigo: String(medicao.codigoestacao ?? process.env.ANA_ESTACAO),
      nome: "Dona Francisca",
    },
    fonte: "ANA HidroWebService",
    medicao: {
      medidoEm: medicao.Data_Hora_Medicao,
      atualizadoEm: medicao.Data_Atualizacao,
      nivelRio: {
        valor: cotaCentimetros === null ? null : cotaCentimetros / 100,
        unidade: "m",
        valorOriginal: cotaCentimetros,
        unidadeOriginal: "cm",
        qualidade: interpretarQualidade(medicao.Cota_Adotada_Status),
      },
      precipitacao: {
        valor: converterNumero(medicao.Chuva_Adotada),
        unidade: "mm",
        qualidade: interpretarQualidade(medicao.Chuva_Adotada_Status),
      },
      vazao: {
        valor: converterNumero(medicao.Vazao_Adotada),
        unidade: "m³/s",
        qualidade: interpretarQualidade(medicao.Vazao_Adotada_Status),
      },
    },
  };
}

module.exports = async function handler(requisicao, resposta) {
  if (requisicao.method !== "GET") {
    resposta.setHeader("Allow", "GET");
    return resposta.status(405).json({ erro: "Método não permitido." });
  }

  try {
    let token = await autenticar();
    let respostaAna = await consultarSerie(token);

    if (respostaAna.status === 401) {
      token = await autenticar({ forcarNovoToken: true });
      respostaAna = await consultarSerie(token);
    }

    if (!respostaAna.ok) {
      throw new Error(`Falha na consulta da ANA: HTTP ${respostaAna.status}`);
    }

    const dados = await respostaAna.json();
    const medicoes = Array.isArray(dados?.items) ? dados.items : [];
    const medicaoMaisRecente = encontrarMedicaoMaisRecente(medicoes);

    if (!medicaoMaisRecente) {
      return resposta.status(404).json({
        erro: "Nenhuma medição foi encontrada para a estação.",
      });
    }

    resposta.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600",
    );

    return resposta.status(200).json(normalizarMedicao(medicaoMaisRecente));
  } catch (erro) {
    console.error("Erro na integração com a ANA:", erro.message);

    return resposta.status(502).json({
      erro: "Não foi possível consultar os dados da ANA.",
    });
  }
};
