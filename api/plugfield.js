const TIMEOUT_PLUGFIELD_MS = 30000;
const TIMEOUT_BANCO_MS = 5000;
const CODIGO_EXTERNO_PADRAO = "1942";
const DEVICE_ID_PADRAO = "10595";

const {
  bancoConfigurado,
  finalizarExecucaoColetaPlugfield,
  iniciarExecucaoColetaPlugfield,
  obterAcumuladosChuvaPlugfield,
  obterUltimaMedicaoPlugfield,
  salvarMedicaoPlugfield,
} = require("../lib/repositorio-meteorologico");

let tokenEmCache = null;

function executarComTimeout(promessa, tempoMs, descricao) {
  let temporizador;
  const limite = new Promise((_, rejeitar) => {
    temporizador = setTimeout(
      () => rejeitar(new Error(`${descricao} excedeu ${tempoMs} ms.`)),
      tempoMs,
    );
  });
  return Promise.race([promessa, limite]).finally(() => clearTimeout(temporizador));
}

function obterVariavelObrigatoria(nome) {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável de ambiente ausente: ${nome}`);
  return valor;
}

function numero(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
}

function obterCodigoExterno() {
  return process.env.PLUGFIELD_DEVICE_CODE || CODIGO_EXTERNO_PADRAO;
}

function configuracao() {
  const baseUrl = obterVariavelObrigatoria("PLUGFIELD_BASE_URL").replace(/\/$/, "");
  if (new URL(baseUrl).hostname !== "prod-api.plugfield.com.br") {
    throw new Error("PLUGFIELD_BASE_URL deve apontar para a API oficial.");
  }
  return {
    baseUrl,
    apiKey: obterVariavelObrigatoria("PLUGFIELD_API_KEY"),
    deviceId: process.env.PLUGFIELD_DEVICE_ID || DEVICE_ID_PADRAO,
    codigoExterno: obterCodigoExterno(),
  };
}

async function autenticar({ forcar = false } = {}) {
  if (tokenEmCache && !forcar) return tokenEmCache;
  const { baseUrl, apiKey } = configuracao();
  const resposta = await fetch(`${baseUrl}/login`, {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_PLUGFIELD_MS),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      username: obterVariavelObrigatoria("METEO1_USUARIO"),
      password: obterVariavelObrigatoria("METEO1_SENHA"),
    }),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok || !dados.access_token) {
    throw new Error(`Falha no login Plugfield: HTTP ${resposta.status}`);
  }
  tokenEmCache = dados.access_token;
  return tokenEmCache;
}

async function consultarDispositivo(token) {
  const { baseUrl, apiKey, deviceId } = configuracao();
  return fetch(`${baseUrl}/device/${encodeURIComponent(deviceId)}`, {
    signal: AbortSignal.timeout(TIMEOUT_PLUGFIELD_MS),
    headers: { Accept: "application/json", Authorization: token, "x-api-key": apiKey },
  });
}

function normalizarDispositivo(dispositivo) {
  const dashboard = dispositivo?.dashboard ?? {};
  const ultima = dashboard?.lastSensorData ?? {};
  const sensores = new Map(
    (ultima.sensorDataList ?? []).map((sensor) => [Number(sensor.sensorId), sensor]),
  );
  const valor = (id) => numero(sensores.get(id)?.dataValue);
  const instanteMs = numero(ultima.time ?? dashboard.lastUpdateTimestamp);
  if (!instanteMs) throw new Error("A Plugfield não retornou o horário da medição.");

  return {
    medidoEm: new Date(instanteMs).toISOString(),
    temperatura: valor(8),
    sensacaoTermica: valor(27),
    pontoOrvalho: valor(22),
    deltaT: valor(28),
    umidade: valor(11),
    vento: valor(36),
    rajada: valor(37),
    direcaoVento: valor(16),
    chuvaIntervalo: valor(35),
    chuvaDia: numero(dashboard.rainDay),
    pressaoAbsoluta: valor(21),
    pressaoRelativa: valor(23),
    luminosidade: valor(18),
    indiceUv: valor(19),
    radiacaoSolar: numero(dashboard.radiation),
    bateria: valor(1),
    sinalWifi: valor(25),
    payload: {
      deviceId: dispositivo.id,
      serialNumber: dispositivo.serialNumber,
      gmt: dispositivo.gmt,
      refreshInterval: dispositivo.refreshInterval,
      sensores: ultima.sensorDataList ?? [],
      chuvaDia: numero(dashboard.rainDay),
      radiacaoSolar: numero(dashboard.radiation),
    },
  };
}

async function coletarEPersistir() {
  const { codigoExterno } = configuracao();
  let execucaoId = null;

  try {
    if (bancoConfigurado()) {
      execucaoId = await executarComTimeout(
        iniciarExecucaoColetaPlugfield(codigoExterno),
        TIMEOUT_BANCO_MS,
        "Inicialização da coleta Plugfield",
      );
    }
    let token = await autenticar();
    let resposta = await consultarDispositivo(token);
    if (resposta.status === 401 || resposta.status === 403) {
      tokenEmCache = null;
      token = await autenticar({ forcar: true });
      resposta = await consultarDispositivo(token);
    }
    if (!resposta.ok) {
      throw new Error(`Falha na consulta Plugfield: HTTP ${resposta.status}`);
    }
    const dispositivo = await resposta.json();
    const medicao = normalizarDispositivo(dispositivo);
    const quantidadeInserida = bancoConfigurado()
      ? await executarComTimeout(
          salvarMedicaoPlugfield(codigoExterno, medicao),
          TIMEOUT_BANCO_MS,
          "Persistência Plugfield",
        )
      : 0;
    if (execucaoId) {
      await executarComTimeout(
        finalizarExecucaoColetaPlugfield(execucaoId, {
          status: "sucesso",
          quantidadeRecebida: 1,
          quantidadeInserida,
        }),
        TIMEOUT_BANCO_MS,
        "Finalização da coleta Plugfield",
      );
    }
    return { medicao, quantidadeInserida };
  } catch (erro) {
    if (execucaoId) {
      try {
        await executarComTimeout(
          finalizarExecucaoColetaPlugfield(execucaoId, {
            status: "erro",
            mensagemErro: erro.message,
          }),
          TIMEOUT_BANCO_MS,
          "Registro do erro da coleta Plugfield",
        );
      } catch (erroBanco) {
        console.error("Erro ao registrar falha Plugfield:", erroBanco.message);
      }
    }
    throw erro;
  }
}

function normalizarLinhaBanco(linha, acumulados = null) {
  const medidoEm = new Date(linha.medido_em).toISOString();
  const idadeMinutos = Math.max(0, (Date.now() - new Date(medidoEm).getTime()) / 60000);
  return {
    estacao: { codigo: linha.codigo_externo, nome: linha.nome, fonte: "Plugfield" },
    medicao: {
      medidoEm,
      temperatura: { valor: numero(linha.temperatura_c), unidade: "°C" },
      sensacaoTermica: { valor: numero(linha.sensacao_termica_c), unidade: "°C" },
      pontoOrvalho: { valor: numero(linha.ponto_orvalho_c), unidade: "°C" },
      umidade: { valor: numero(linha.umidade_percentual), unidade: "%" },
      vento: { valor: numero(linha.vento_kmh), unidade: "km/h" },
      rajada: { valor: numero(linha.rajada_kmh), unidade: "km/h" },
      direcaoVento: { valor: numero(linha.direcao_vento_graus), unidade: "°" },
      chuvaIntervalo: { valor: numero(linha.chuva_intervalo_mm), unidade: "mm" },
      chuvaDia: { valor: numero(linha.chuva_dia_mm), unidade: "mm" },
      chuvaAcumulada: normalizarAcumuladosChuva(acumulados),
      pressaoAbsoluta: { valor: numero(linha.pressao_absoluta_hpa), unidade: "hPa" },
      pressaoRelativa: { valor: numero(linha.pressao_relativa_hpa), unidade: "hPa" },
      indiceUv: { valor: numero(linha.indice_uv), unidade: "UV" },
      luminosidade: { valor: numero(linha.luminosidade_lux), unidade: "lux" },
      bateria: { valor: numero(linha.bateria_percentual), unidade: "%" },
      sinalWifi: { valor: numero(linha.sinal_wifi_percentual), unidade: "%" },
    },
    persistencia: {
      origemLeitura: "banco",
      idadeMinutos,
      situacaoAtualizacao: idadeMinutos > 30 ? "desatualizado" : "atualizado",
    },
  };
}

function normalizarAcumuladosChuva(acumulados) {
  if (!acumulados?.referencia_em || !acumulados?.inicio_historico) return null;
  const referencia = new Date(acumulados.referencia_em);
  const inicio = new Date(acumulados.inicio_historico);
  const item = (valor, minutos) => ({
    valor: numero(valor),
    unidade: "mm",
    completo: inicio <= new Date(referencia.getTime() - minutos * 60000),
  });
  return {
    referenciaEm: referencia.toISOString(),
    ultimos30Min: item(acumulados.ultimos_30_min, 30),
    ultimaHora: item(acumulados.ultima_hora, 60),
    ultimas12Horas: item(acumulados.ultimas_12_horas, 12 * 60),
    ultimas24Horas: item(acumulados.ultimas_24_horas, 24 * 60),
  };
}

async function obterDadosBanco() {
  const codigoExterno = obterCodigoExterno();
  if (!bancoConfigurado()) return null;
  const [linha, acumulados] = await executarComTimeout(
    Promise.all([
      obterUltimaMedicaoPlugfield(codigoExterno),
      obterAcumuladosChuvaPlugfield(codigoExterno),
    ]),
    TIMEOUT_BANCO_MS,
    "Leitura Plugfield no banco",
  );
  return linha ? normalizarLinhaBanco(linha, acumulados) : null;
}

module.exports = async function handler(requisicao, resposta) {
  if (requisicao.method !== "GET") {
    resposta.setHeader("Allow", "GET");
    return resposta.status(405).json({ erro: "Método não permitido." });
  }
  try {
    resposta.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=900, stale-if-error=86400");
    const dados = await obterDadosBanco();
    if (!dados) return resposta.status(503).json({ erro: "Ainda não há medição Plugfield armazenada." });
    return resposta.status(200).json(dados);
  } catch (erro) {
    console.error("Erro ao consultar dado Plugfield armazenado:", erro.message);
    return resposta.status(503).json({ erro: "Dado meteorológico armazenado indisponível." });
  }
};

module.exports.coletarEPersistir = coletarEPersistir;
module.exports.normalizarDispositivo = normalizarDispositivo;
