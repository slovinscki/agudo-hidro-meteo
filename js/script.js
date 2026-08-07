const CAMINHO_DADOS = "data/dados.json";

function formatarNumero(valor) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

function formatarData(dataISO) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(dataISO));
}

function atualizarTexto(id, texto) {
  const elemento = document.querySelector(`#${id}`);

  if (elemento) {
    elemento.textContent = texto;
  }
}

function exibirDados(dados) {
  const { estacao, medicao } = dados;
  const nivelFormatado = `${formatarNumero(medicao.nivelRio)} ${medicao.unidadeNivel}`;
  const chuvaFormatada = `${formatarNumero(medicao.precipitacao24h)} ${medicao.unidadePrecipitacao}`;
  const horarioFormatado = formatarData(medicao.medidoEm);

  atualizarTexto("resumo-nivel", nivelFormatado);
  atualizarTexto("resumo-horario", horarioFormatado);
  atualizarTexto("resumo-status", medicao.status);
  atualizarTexto("nivel-atual", nivelFormatado);
  atualizarTexto("nome-estacao", estacao.nome);
  atualizarTexto("tendencia-nivel", medicao.tendencia);
  atualizarTexto("horario-nivel", horarioFormatado);
  atualizarTexto("status-nivel", medicao.status);
  atualizarTexto("fonte-nivel", estacao.fonte);
  atualizarTexto("chuva-24h", chuvaFormatada);

  document.querySelector("#nivel-atual").value = medicao.nivelRio;
  document.querySelector("#chuva-24h").value = medicao.precipitacao24h;
  document.querySelector("#resumo-horario").dateTime = medicao.medidoEm;
  document.querySelector("#horario-nivel").dateTime = medicao.medidoEm;
}

function exibirErro() {
  const mensagem = "Dados indisponíveis";

  atualizarTexto("resumo-nivel", mensagem);
  atualizarTexto("resumo-horario", mensagem);
  atualizarTexto("resumo-status", mensagem);
  atualizarTexto("nivel-atual", mensagem);
  atualizarTexto("chuva-24h", mensagem);
}

async function carregarDados() {
  try {
    const resposta = await fetch(CAMINHO_DADOS);

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const dados = await resposta.json();
    exibirDados(dados);
  } catch (erro) {
    console.error("Não foi possível carregar os dados:", erro);
    exibirErro();
  }
}

carregarDados();
