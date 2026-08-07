const CAMINHO_DADOS = "data/dados.json";
const CAMINHO_ESTACOES = "data/estacoes.json";

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

function criarItemDetalhe(titulo, valor) {
  const grupo = document.createElement("div");
  const termo = document.createElement("dt");
  const descricao = document.createElement("dd");

  termo.textContent = titulo;
  descricao.textContent = valor;
  grupo.append(termo, descricao);

  return grupo;
}

function formatarTipoEstacao(tipo) {
  const tipos = {
    hidrologica: "Hidrológica",
    meteorologica: "Meteorológica",
  };

  return tipos[tipo] ?? "A confirmar";
}

function formatarStatusCadastro(status) {
  const statusDisponiveis = {
    confirmada: "Cadastro confirmado",
    local_confirmado: "Local confirmado; dados técnicos pendentes",
    pendente: "Cadastro pendente",
  };

  return statusDisponiveis[status] ?? "Status não informado";
}

function criarCartaoEstacao(estacao) {
  const cartao = document.createElement("article");
  const numero = document.createElement("p");
  const titulo = document.createElement("h3");
  const detalhes = document.createElement("dl");

  cartao.className = "cartao-estacao";
  numero.className = "estacao-numero";
  numero.textContent = `Estação ${estacao.ordem}`;
  titulo.textContent = estacao.nome;

  detalhes.append(
    criarItemDetalhe("Local", estacao.local ?? "A confirmar"),
    criarItemDetalhe("Tipo", formatarTipoEstacao(estacao.tipo)),
    criarItemDetalhe(
      "Posicionada em rio",
      estacao.posicionadaEmRio ? "Sim" : "Não",
    ),
    criarItemDetalhe("Fonte dos dados", estacao.fonte),
  );

  if (estacao.instituicaoResponsavel) {
    detalhes.append(
      criarItemDetalhe("Responsável", estacao.instituicaoResponsavel),
    );
  }

  if (estacao.fabricanteHardware || estacao.provedorSoftware) {
    detalhes.append(
      criarItemDetalhe(
        "Tecnologia",
        estacao.fabricanteHardware ?? estacao.provedorSoftware,
      ),
    );
  }

  detalhes.append(
    criarItemDetalhe(
      "Código externo",
      estacao.codigoExterno ?? "A confirmar",
    ),
    criarItemDetalhe("Status", formatarStatusCadastro(estacao.statusCadastro)),
  );

  cartao.append(numero, titulo, detalhes);

  return cartao;
}

function exibirEstacoes(estacoes) {
  const lista = document.querySelector("#lista-estacoes");

  lista.replaceChildren(...estacoes.map(criarCartaoEstacao));
}

async function carregarEstacoes() {
  const lista = document.querySelector("#lista-estacoes");

  try {
    const resposta = await fetch(CAMINHO_ESTACOES);

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const estacoes = await resposta.json();
    exibirEstacoes(estacoes);
  } catch (erro) {
    console.error("Não foi possível carregar as estações:", erro);
    lista.innerHTML = "<p>Estações indisponíveis no momento.</p>";
  }
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
carregarEstacoes();
