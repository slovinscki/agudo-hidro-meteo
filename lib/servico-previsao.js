const { salvarPrevisao } = require("./repositorio-previsao");

const LATITUDE = Number(process.env.PREVISAO_LATITUDE ?? -29.6447);
const LONGITUDE = Number(process.env.PREVISAO_LONGITUDE ?? -53.2511);
const LOCAL_CODIGO = "agudo-rs";
const TIMEOUT_MS = 12000;

function numero(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
}

function resumir(horas) {
  const proximas24 = horas.slice(0, 24);
  const valores = (campo) => proximas24.map((hora) => hora[campo]).filter(Number.isFinite);
  const soma = valores("precipitacaoMm").reduce((total, valor) => total + valor, 0);
  const temperaturas = valores("temperaturaC");
  const probabilidades = valores("probabilidadePrecipitacaoPercentual");
  const ventos = valores("ventoKmh");
  const rajadas = valores("rajadaKmh");
  return {
    periodoHoras: 24,
    inicioEm: proximas24[0]?.horario ?? null,
    fimEm: proximas24.at(-1)?.horario ?? null,
    precipitacaoMm: soma,
    probabilidadeMaximaPercentual: probabilidades.length ? Math.max(...probabilidades) : null,
    temperaturaMinC: temperaturas.length ? Math.min(...temperaturas) : null,
    temperaturaMaxC: temperaturas.length ? Math.max(...temperaturas) : null,
    ventoMaxKmh: ventos.length ? Math.max(...ventos) : null,
    rajadaMaxKmh: rajadas.length ? Math.max(...rajadas) : null,
  };
}

function montarPrevisao({ fonte, modelo, emitidoEm, horas }) {
  if (!horas.length) throw new Error(`${fonte.nome} não retornou previsão horária.`);
  return {
    naturezaDado: "previsto",
    local: { codigo: LOCAL_CODIGO, nome: "Agudo", uf: "RS", latitude: LATITUDE, longitude: LONGITUDE },
    fonte,
    modelo,
    emitidoEm,
    inicioEm: horas[0].horario,
    fimEm: horas.at(-1).horario,
    resumo24h: resumir(horas),
    horas,
  };
}

async function consultarOpenMeteo() {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", LATITUDE);
  url.searchParams.set("longitude", LONGITUDE);
  url.searchParams.set("hourly", [
    "temperature_2m", "relative_humidity_2m", "precipitation_probability",
    "precipitation", "weather_code", "wind_speed_10m", "wind_gusts_10m",
  ].join(","));
  url.searchParams.set("forecast_hours", "48");
  url.searchParams.set("timezone", "UTC");
  const resposta = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!resposta.ok) throw new Error(`Open-Meteo respondeu HTTP ${resposta.status}.`);
  const payload = await resposta.json();
  const horario = payload.hourly?.time ?? [];
  const horas = horario.map((valor, indice) => ({
    horario: `${valor}Z`,
    temperaturaC: numero(payload.hourly.temperature_2m?.[indice]),
    umidadePercentual: numero(payload.hourly.relative_humidity_2m?.[indice]),
    probabilidadePrecipitacaoPercentual: numero(payload.hourly.precipitation_probability?.[indice]),
    precipitacaoMm: numero(payload.hourly.precipitation?.[indice]),
    codigoTempo: numero(payload.hourly.weather_code?.[indice]),
    ventoKmh: numero(payload.hourly.wind_speed_10m?.[indice]),
    rajadaKmh: numero(payload.hourly.wind_gusts_10m?.[indice]),
  }));
  const previsao = montarPrevisao({
    fonte: { codigo: "OPEN_METEO", nome: "Open-Meteo", url: "https://open-meteo.com/" },
    modelo: "Best Match",
    emitidoEm: new Date().toISOString(),
    horas,
  });
  return { previsao, payload };
}

async function consultarMetNorway() {
  const url = new URL("https://api.met.no/weatherapi/locationforecast/2.0/compact");
  url.searchParams.set("lat", LATITUDE.toFixed(4));
  url.searchParams.set("lon", LONGITUDE.toFixed(4));
  const userAgent = process.env.MET_NORWAY_USER_AGENT ||
    "Agudo-Hidro-Meteo/1.0 https://github.com/slovinscki/agudo-hidro-meteo";
  const resposta = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json", "User-Agent": userAgent },
  });
  if (!resposta.ok) throw new Error(`MET Norway respondeu HTTP ${resposta.status}.`);
  const payload = await resposta.json();
  const series = (payload.properties?.timeseries ?? []).slice(0, 48);
  const horas = series.map((item) => {
    const instantaneo = item.data?.instant?.details ?? {};
    const proximaHora = item.data?.next_1_hours?.details ?? {};
    return {
      horario: item.time,
      temperaturaC: numero(instantaneo.air_temperature),
      umidadePercentual: numero(instantaneo.relative_humidity),
      probabilidadePrecipitacaoPercentual: null,
      precipitacaoMm: numero(proximaHora.precipitation_amount),
      codigoTempo: item.data?.next_1_hours?.summary?.symbol_code ?? null,
      ventoKmh: numero(instantaneo.wind_speed) === null ? null : numero(instantaneo.wind_speed) * 3.6,
      rajadaKmh: numero(instantaneo.wind_speed_of_gust) === null ? null : numero(instantaneo.wind_speed_of_gust) * 3.6,
    };
  });
  const previsao = montarPrevisao({
    fonte: { codigo: "MET_NORWAY", nome: "MET Norway", url: "https://api.met.no/" },
    modelo: "Locationforecast 2.0 compact — contingência",
    emitidoEm: payload.properties?.meta?.updated_at ?? new Date().toISOString(),
    horas,
  });
  return { previsao, payload };
}

async function coletarPrevisao() {
  let resultado;
  let erroPrincipal = null;
  try {
    resultado = await consultarOpenMeteo();
  } catch (erro) {
    erroPrincipal = erro;
    resultado = await consultarMetNorway();
  }
  const quantidadeInserida = await salvarPrevisao(resultado.previsao, resultado.payload);
  return { previsao: resultado.previsao, quantidadeInserida, contingencia: Boolean(erroPrincipal), erroPrincipal: erroPrincipal?.message ?? null };
}

module.exports = { coletarPrevisao, consultarMetNorway, consultarOpenMeteo, resumir };
