const ANA_API_URL =
  "https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas";

const DURACAO_TOKEN_MS = 55 * 60 * 1000;

const {
  bancoConfigurado,
  finalizarExecucaoColeta,
  iniciarExecucaoColeta,
  obterUltimasMedicoes,
  salvarMedicoesAna,
} = require("../lib/repositorio-hidrologico");

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
    ok: "ok",
    suspeito: "suspeito",
    ruim: "ruim",
    nao_informado: "nao_informado",
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

function calcularVariacaoNivel(medicoes, medicaoMaisRecente) {
  const nivelAtual = converterNumero(medicaoMaisRecente?.Cota_Adotada);
  const dataAtual = new Date(medicaoMaisRecente?.Data_Hora_Medicao);

  if (nivelAtual === null || Number.isNaN(dataAtual.getTime())) {
    return null;
  }

  const seisHorasMs = 6 * 60 * 60 * 1000;
  const anterioresValidas = medicoes
    .map((medicao) => ({
      medicao,
      nivel: converterNumero(medicao.Cota_Adotada),
      data: new Date(medicao.Data_Hora_Medicao),
    }))
    .filter(
      ({ nivel, data }) =>
        nivel !== null &&
        !Number.isNaN(data.getTime()) &&
        data < dataAtual,
    )
    .sort(
      (a, b) =>
        Math.abs(dataAtual - a.data - seisHorasMs) -
        Math.abs(dataAtual - b.data - seisHorasMs),
    );
  const referencia = anterioresValidas[0];

  if (!referencia) {
    return null;
  }

  const intervaloHoras = (dataAtual - referencia.data) / (60 * 60 * 1000);

  if (intervaloHoras < 1 || intervaloHoras > 12) {
    return null;
  }

  const taxaCmHora = (nivelAtual - referencia.nivel) / intervaloHoras;
  const tendencia =
    taxaCmHora > 0.1
      ? "subindo"
      : taxaCmHora < -0.1
        ? "baixando"
        : "estável";

  return {
    taxaCmHora,
    tendencia,
    janelaHoras: intervaloHoras,
    referenciaEm: referencia.medicao.Data_Hora_Medicao,
  };
}

function normalizarMedicao(medicao, variacaoNivel) {
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
      taxaVariacaoCmHora: variacaoNivel?.taxaCmHora ?? null,
      tendencia: variacaoNivel?.tendencia ?? null,
      janelaVariacaoHoras: variacaoNivel?.janelaHoras ?? null,
      referenciaVariacaoEm: variacaoNivel?.referenciaEm ?? null,
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

function converterMedicaoBanco(linha) {
  return {
    codigoestacao: process.env.ANA_ESTACAO,
    Data_Hora_Medicao: new Date(linha.medido_em).toISOString(),
    Data_Atualizacao: new Date(linha.coletado_em).toISOString(),
    Cota_Adotada:
      linha.nivel_metros === null ? null : Number(linha.nivel_metros) * 100,
    Cota_Adotada_Status: linha.qualidade_nivel,
    Chuva_Adotada: linha.chuva_mm,
    Chuva_Adotada_Status: linha.qualidade_chuva,
    Vazao_Adotada: linha.vazao_m3s,
    Vazao_Adotada_Status: linha.qualidade_vazao,
  };
}

async function coletarEPersistir() {
  const codigoEstacao = obterVariavelObrigatoria("ANA_ESTACAO");
  let execucaoId = null;

  if (bancoConfigurado()) {
    execucaoId = await iniciarExecucaoColeta(codigoEstacao);
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
      throw new Error("Nenhuma medição foi encontrada para a estação.");
    }

    const quantidadeInserida = await salvarMedicoesAna(
      codigoEstacao,
      medicoes,
      { numero: converterNumero, qualidade: interpretarQualidade },
    );
    await finalizarExecucaoColeta(execucaoId, {
      status: "sucesso",
      quantidadeRecebida: medicoes.length,
      quantidadeInserida,
    });

    const variacaoNivel = calcularVariacaoNivel(medicoes, medicaoMaisRecente);
    return {
      dados: normalizarMedicao(medicaoMaisRecente, variacaoNivel),
      persistencia: {
        configurada: bancoConfigurado(),
        quantidadeRecebida: medicoes.length,
        quantidadeInserida,
      },
    };
  } catch (erro) {
    await finalizarExecucaoColeta(execucaoId, {
      status: "erro",
      mensagemErro: erro.message,
    });
    throw erro;
  }
}

async function obterFallbackBanco() {
  const codigoEstacao = process.env.ANA_ESTACAO;
  if (!codigoEstacao || !bancoConfigurado()) return null;

  const linhas = await obterUltimasMedicoes(codigoEstacao);
  if (linhas.length === 0) return null;

  const medicoes = linhas.map(converterMedicaoBanco);
  const maisRecente = encontrarMedicaoMaisRecente(medicoes);
  const variacaoNivel = calcularVariacaoNivel(medicoes, maisRecente);
  const dados = normalizarMedicao(maisRecente, variacaoNivel);

  dados.fonte = "ANA — última medição armazenada";
  dados.persistencia = {
    fallback: true,
    motivo: "Fonte ANA temporariamente indisponível",
    recuperadoEm: new Date().toISOString(),
  };

  return dados;
}

module.exports = async function handler(requisicao, resposta) {
  if (requisicao.method !== "GET") {
    resposta.setHeader("Allow", "GET");
    return resposta.status(405).json({ erro: "Método não permitido." });
  }

  try {
    resposta.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600",
    );
    const resultado = await coletarEPersistir();
    return resposta.status(200).json({
      ...resultado.dados,
      persistencia: resultado.persistencia,
    });
  } catch (erro) {
    console.error("Erro na integração com a ANA:", erro.message);

    try {
      const fallback = await obterFallbackBanco();
      if (fallback) {
        resposta.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
        return resposta.status(200).json(fallback);
      }
    } catch (erroBanco) {
      console.error("Erro ao consultar fallback do banco:", erroBanco.message);
    }

    return resposta.status(502).json({
      erro: "Não foi possível consultar os dados da ANA.",
    });
  }
};

module.exports.coletarEPersistir = coletarEPersistir;
