const ANA_API_URL =
  "https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas";
const CODIGO_ESTACAO_PADRAO = "85400000";

const DURACAO_TOKEN_MS = 55 * 60 * 1000;
const timeoutAnaConfigurado = Number(process.env.TIMEOUT_ANA_MS);
const TIMEOUT_ANA_MS =
  Number.isFinite(timeoutAnaConfigurado) && timeoutAnaConfigurado > 0
    ? timeoutAnaConfigurado
    : 45000;
const TIMEOUT_BANCO_MS = 5000;
const limiteDesatualizadoConfigurado = Number(
  process.env.LIMITE_DADO_DESATUALIZADO_MINUTOS,
);
const LIMITE_DESATUALIZADO_MINUTOS =
  Number.isFinite(limiteDesatualizadoConfigurado) &&
  limiteDesatualizadoConfigurado > 0
    ? limiteDesatualizadoConfigurado
    : 60;

const {
  bancoConfigurado,
  finalizarExecucaoColeta,
  iniciarExecucaoColeta,
  obterAcumuladosChuvaAna,
  obterUltimasMedicoes,
  salvarMedicoesAna,
} = require("../lib/repositorio-hidrologico");

let tokenEmCache = null;
let tokenExpiraEm = 0;

function executarComTimeout(promessa, tempoMs, descricao) {
  let temporizador;
  const limite = new Promise((_, rejeitar) => {
    temporizador = setTimeout(
      () => rejeitar(new Error(`${descricao} excedeu ${tempoMs} ms.`)),
      tempoMs,
    );
  });

  return Promise.race([promessa, limite]).finally(() =>
    clearTimeout(temporizador),
  );
}

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
    signal: AbortSignal.timeout(TIMEOUT_ANA_MS),
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
  const codigoEstacao = process.env.ANA_ESTACAO || CODIGO_ESTACAO_PADRAO;
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
    signal: AbortSignal.timeout(TIMEOUT_ANA_MS),
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

function normalizarDataAna(valor) {
  if (!valor) return valor;

  const texto = String(valor).trim();
  const possuiFuso = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(texto);
  const textoIso = texto.replace(" ", "T");
  const instante = new Date(possuiFuso ? textoIso : `${textoIso}-03:00`);

  if (Number.isNaN(instante.getTime())) {
    throw new Error(`Data inválida recebida da ANA: ${texto}`);
  }

  return instante.toISOString();
}

function normalizarDatasMedicaoAna(medicao) {
  return {
    ...medicao,
    Data_Hora_Medicao: normalizarDataAna(medicao.Data_Hora_Medicao),
    Data_Atualizacao: normalizarDataAna(medicao.Data_Atualizacao),
  };
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
      codigo: String(
        medicao.codigoestacao ??
          process.env.ANA_ESTACAO ??
          CODIGO_ESTACAO_PADRAO,
      ),
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

async function coletarEPersistir({ persistir = true } = {}) {
  const codigoEstacao = process.env.ANA_ESTACAO || CODIGO_ESTACAO_PADRAO;
  let execucaoId = null;

  try {
    if (persistir && bancoConfigurado()) {
      execucaoId = await executarComTimeout(
        iniciarExecucaoColeta(codigoEstacao),
        TIMEOUT_BANCO_MS,
        "Inicialização da coleta no banco",
      );
    }

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
    const medicoes = Array.isArray(dados?.items)
      ? dados.items.map(normalizarDatasMedicaoAna)
      : [];
    const medicaoMaisRecente = encontrarMedicaoMaisRecente(medicoes);

    if (!medicaoMaisRecente) {
      throw new Error("Nenhuma medição foi encontrada para a estação.");
    }

    let quantidadeInserida = 0;
    if (persistir && bancoConfigurado()) {
      quantidadeInserida = await executarComTimeout(
        salvarMedicoesAna(codigoEstacao, medicoes, {
          numero: converterNumero,
          qualidade: interpretarQualidade,
        }),
        TIMEOUT_BANCO_MS,
        "Persistência das medições no banco",
      );
      await executarComTimeout(
        finalizarExecucaoColeta(execucaoId, {
          status: "sucesso",
          quantidadeRecebida: medicoes.length,
          quantidadeInserida,
        }),
        TIMEOUT_BANCO_MS,
        "Finalização da coleta no banco",
      );
    }

    const variacaoNivel = calcularVariacaoNivel(medicoes, medicaoMaisRecente);
    return {
      dados: normalizarMedicao(medicaoMaisRecente, variacaoNivel),
      persistencia: {
        configurada: bancoConfigurado(),
        executada: persistir && bancoConfigurado(),
        quantidadeRecebida: medicoes.length,
        quantidadeInserida,
      },
    };
  } catch (erro) {
    if (execucaoId) {
      try {
        await executarComTimeout(
          finalizarExecucaoColeta(execucaoId, {
            status: "erro",
            mensagemErro: erro.message,
          }),
          TIMEOUT_BANCO_MS,
          "Registro do erro da coleta no banco",
        );
      } catch (erroBanco) {
        console.error("Erro ao registrar falha no banco:", erroBanco.message);
      }
    }
    throw erro;
  }
}

async function obterDadosBanco() {
  const codigoEstacao = process.env.ANA_ESTACAO || CODIGO_ESTACAO_PADRAO;
  if (!bancoConfigurado()) return null;

  const [linhas, acumulados] = await executarComTimeout(
    Promise.all([
      obterUltimasMedicoes(codigoEstacao),
      obterAcumuladosChuvaAna(codigoEstacao),
    ]),
    TIMEOUT_BANCO_MS,
    "Consulta ao fallback do banco",
  );
  if (linhas.length === 0) return null;

  const medicoes = linhas.map(converterMedicaoBanco);
  const maisRecente = encontrarMedicaoMaisRecente(medicoes);
  const variacaoNivel = calcularVariacaoNivel(medicoes, maisRecente);
  const dados = normalizarMedicao(maisRecente, variacaoNivel);

  dados.medicao.chuvaAcumulada = normalizarAcumuladosChuva(acumulados);

  dados.fonte = "ANA — dado armazenado";
  const medidoEmMs = new Date(dados.medicao.medidoEm).getTime();
  const idadeMinutos = Number.isNaN(medidoEmMs)
    ? null
    : Math.max(0, (Date.now() - medidoEmMs) / (60 * 1000));
  const desatualizado =
    idadeMinutos === null || idadeMinutos > LIMITE_DESATUALIZADO_MINUTOS;

  dados.persistencia = {
    origemLeitura: "banco",
    fallback: false,
    recuperadoEm: new Date().toISOString(),
    idadeMinutos,
    limiteDesatualizadoMinutos: LIMITE_DESATUALIZADO_MINUTOS,
    situacaoAtualizacao: desatualizado ? "desatualizado" : "atualizado",
  };

  return dados;
}

function normalizarAcumuladosChuva(acumulados) {
  if (!acumulados?.referencia_em || !acumulados?.inicio_historico) return null;
  const referencia = new Date(acumulados.referencia_em);
  const inicio = new Date(acumulados.inicio_historico);
  const item = (valor, minutos) => ({
    valor: Number(valor),
    unidade: "mm",
    completo: inicio <= new Date(referencia.getTime() - minutos * 60000),
  });
  return {
    referenciaEm: referencia.toISOString(),
    acumuladoDia: {
      valor: Number(acumulados.acumulado_dia),
      unidade: "mm",
    },
    ultimos30Min: item(acumulados.ultimos_30_min, 30),
    ultimaHora: item(acumulados.ultima_hora, 60),
    ultimas12Horas: item(acumulados.ultimas_12_horas, 12 * 60),
    ultimas24Horas: item(acumulados.ultimas_24_horas, 24 * 60),
  };
}

module.exports = async function handler(requisicao, resposta) {
  if (requisicao.method !== "GET") {
    resposta.setHeader("Allow", "GET");
    return resposta.status(405).json({ erro: "Método não permitido." });
  }

  try {
    resposta.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=900, stale-if-error=86400",
    );
    const dados = await obterDadosBanco();

    if (!dados) {
      resposta.setHeader("Cache-Control", "no-store");
      return resposta.status(503).json({
        erro: "Ainda não há medição armazenada no banco.",
      });
    }

    return resposta.status(200).json(dados);
  } catch (erro) {
    console.error("Erro ao consultar medição armazenada:", erro.message);
    resposta.setHeader("Cache-Control", "no-store");
    return resposta.status(503).json({
      erro: "Não foi possível consultar os dados armazenados.",
    });
  }
};

module.exports.coletarEPersistir = coletarEPersistir;
module.exports.normalizarDataAna = normalizarDataAna;
module.exports.obterDadosBanco = obterDadosBanco;
