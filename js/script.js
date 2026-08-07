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

function avaliarImpactoEstrada(nivel, regras) {
  if (regras.tipoRegra === "bloqueio_total") {
    if (nivel >= regras.limiteBloqueio) {
      return {
        status: "todos",
        texto: `Acesso bloqueado pela regra simulada a partir de ${formatarNumero(regras.limiteBloqueio)} m.`,
      };
    }

    return {
      status: "sem-bloqueio",
      texto: "Sem bloqueio indicado por esta regra simulada.",
    };
  }

  if (nivel > regras.limiteGrandePorte) {
    return {
      status: "todos",
      texto:
        "Bloqueio simulado para veículos de pequeno e de grande porte.",
    };
  }

  if (nivel >= regras.limitePequenoPorte) {
    return {
      status: "pequeno-porte",
      texto: "Bloqueio simulado para veículos de pequeno porte.",
    };
  }

  return {
    status: "sem-bloqueio",
    texto: "Sem bloqueio indicado por esta regra simulada.",
  };
}

function exibirImpactoEstradas(nivel, unidade, regras) {
  atualizarTexto("nivel-estradas", `${formatarNumero(nivel)} ${unidade}`);
  atualizarTexto(
    "fonte-regras-estradas",
    "Regras simuladas para desenvolvimento",
  );

  regras.forEach((regra) => {
    const resultado = avaliarImpactoEstrada(nivel, regra);
    const idSituacao = `situacao-${regra.id}`;
    const situacao = document.querySelector(`#${idSituacao}`);

    atualizarTexto(idSituacao, resultado.texto);

    if (situacao) {
      situacao.dataset.status = resultado.status;
      situacao.closest(".situacao-via")?.setAttribute(
        "data-status",
        resultado.status,
      );
    }
  });
}

function formatarMedida(valor, unidade) {
  return typeof valor === "number"
    ? `${formatarNumero(valor)} ${unidade}`
    : "Não informado";
}

function criarCartaoUsina(usina) {
  const cartao = document.createElement("article");
  const ordem = document.createElement("p");
  const titulo = document.createElement("h3");
  const tipo = document.createElement("p");
  const dados = document.createElement("dl");
  const atualizacao = document.createElement("p");

  cartao.id = usina.id;
  cartao.className = "cartao-usina";
  ordem.className = "usina-ordem";
  ordem.textContent = `${usina.ordem}ª no percurso monitorado`;
  titulo.textContent = usina.nome;
  tipo.className = "usina-tipo-dado";
  tipo.textContent = usina.tipo;

  dados.append(
    criarItemDetalhe(
      "Nível do reservatório",
      formatarMedida(usina.nivelReservatorio, usina.unidadeNivel),
    ),
    criarItemDetalhe(
      "Nível de jusante",
      formatarMedida(usina.nivelJusante, usina.unidadeNivel),
    ),
    criarItemDetalhe(
      "Afluência",
      formatarMedida(usina.afluencia, usina.unidadeVazao),
    ),
    criarItemDetalhe(
      "Defluência",
      formatarMedida(usina.defluencia, usina.unidadeVazao),
    ),
    criarItemDetalhe("Fonte", usina.fonte),
  );

  atualizacao.className = "usina-atualizacao";
  atualizacao.textContent = `Atualização de referência: ${formatarData(usina.atualizadoEm)}`;
  cartao.append(ordem, titulo, tipo, dados, atualizacao);

  if (usina.urlFonte) {
    const link = document.createElement("a");
    link.href = usina.urlFonte;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Consultar fonte";
    cartao.append(link);
  }

  return cartao;
}

function exibirUsinas(usinas) {
  const lista = document.querySelector("#lista-usinas");
  const ordenadas = [...usinas].sort((a, b) => a.ordem - b.ordem);
  lista.replaceChildren(...ordenadas.map(criarCartaoUsina));
}

function exibirResumoLiberacaoUsinas(usinas) {
  const acimaDaReferencia = usinas.filter(
    (usina) =>
      typeof usina.defluencia === "number" &&
      typeof usina.defluenciaReferenciaSimulada === "number" &&
      usina.defluencia > usina.defluenciaReferenciaSimulada,
  );
  const situacao = document.querySelector("#situacao-liberacao-usinas");
  const resumo = document.querySelector("#resumo-liberacao-usinas");

  if (acimaDaReferencia.length === 0) {
    atualizarTexto(
      "situacao-liberacao-usinas",
      "As usinas estão dentro das referências simuladas de defluência.",
    );
    atualizarTexto(
      "efeito-liberacao-usinas",
      "Nenhuma contribuição adicional é indicada por esta regra simulada.",
    );
    resumo.dataset.estado = "normal";
    return;
  }

  const nomes = acimaDaReferencia.map((usina) => usina.nome).join(" e ");
  const plural = acimaDaReferencia.length > 1;

  atualizarTexto(
    "situacao-liberacao-usinas",
    `${nomes} ${plural ? "estão" : "está"} liberando água acima da referência simulada.`,
  );
  atualizarTexto(
    "efeito-liberacao-usinas",
    "Essa condição pode contribuir para elevação do rio a jusante, mas não confirma sozinha a subida em Agudo.",
  );
  situacao.dataset.estado = "acima-da-referencia";
  resumo.dataset.estado = "acima-da-referencia";
}

function exibirDados(dados) {
  const { estacao, medicao, impactoEstradas, usinas } = dados;
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

  exibirImpactoEstradas(
    medicao.nivelRio,
    medicao.unidadeNivel,
    impactoEstradas,
  );
  exibirUsinas(usinas);
  exibirResumoLiberacaoUsinas(usinas);
}

function exibirErro() {
  const mensagem = "Dados indisponíveis";

  atualizarTexto("resumo-nivel", mensagem);
  atualizarTexto("resumo-horario", mensagem);
  atualizarTexto("resumo-status", mensagem);
  atualizarTexto("nivel-atual", mensagem);
  atualizarTexto("chuva-24h", mensagem);
  atualizarTexto("nivel-estradas", mensagem);
  atualizarTexto("fonte-regras-estradas", mensagem);
  atualizarTexto("situacao-desvio-agudo-dona-francisca", mensagem);
  atualizarTexto("situacao-estrada-geral-nova-boemia", mensagem);
  atualizarTexto("situacao-acesso-captacao-corsan", mensagem);
  const listaUsinas = document.querySelector("#lista-usinas");
  if (listaUsinas) {
    listaUsinas.innerHTML = `<p>${mensagem}</p>`;
  }
  atualizarTexto("situacao-liberacao-usinas", mensagem);
  atualizarTexto("efeito-liberacao-usinas", mensagem);
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

function criarNivelEstacao(estacao) {
  const bloco = document.createElement("div");
  const rotulo = document.createElement("span");
  const valor = document.createElement("strong");
  const contexto = document.createElement("small");
  const medicao = estacao.medicaoSimulada;

  bloco.className = "nivel-estacao";
  rotulo.textContent = medicao
    ? "Dado simulado de nível"
    : "Medição instrumental";

  if (!medicao) {
    valor.textContent = "Não disponível";
    contexto.textContent = estacao.posicionadaEmRio
      ? "Sem dado instrumental disponível"
      : "Esta estação não está posicionada em rio";
    bloco.dataset.estado = "indisponivel";
  } else {
    const acimaDaCota = medicao.nivelRio > medicao.cotaReferencia;

    valor.textContent = `${formatarNumero(medicao.nivelRio)} ${medicao.unidade}`;
    contexto.textContent = acimaDaCota
      ? `Acima da cota simulada de ${formatarNumero(medicao.cotaReferencia)} ${medicao.unidade}`
      : `Cota simulada: ${formatarNumero(medicao.cotaReferencia)} ${medicao.unidade}`;
    bloco.dataset.estado = acimaDaCota ? "acima-da-cota" : "abaixo-da-cota";
  }

  bloco.append(rotulo, valor, contexto);
  return bloco;
}

function criarCartaoObservacaoVisual(ponto) {
  const cartao = document.createElement("article");
  const selo = document.createElement("p");
  const titulo = document.createElement("h3");
  const rotuloNivel = document.createElement("p");
  const situacao = document.createElement("strong");
  const regras = document.createElement("details");
  const resumoRegras = document.createElement("summary");
  const listaRegras = document.createElement("dl");
  const tituloPontes = document.createElement("h4");
  const avisoPontes = document.createElement("p");
  const listaPontes = document.createElement("ol");

  cartao.className = "cartao-observacao-visual";
  selo.className = "selo-tipo-dado selo-observacao-visual";
  selo.textContent = "Observação visual — sem instrumento";
  titulo.textContent = ponto.nome;
  rotuloNivel.className = "nivel-visual-atual";
  rotuloNivel.append("Nível atual: ", situacao);

  if (ponto.observacaoVisual) {
    const situacaoAtual = ponto.observacaoVisual.situacao;
    situacao.textContent = situacaoAtual;
    rotuloNivel.dataset.situacao = situacaoAtual
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  } else {
    situacao.textContent = "Aguardando observação";
    rotuloNivel.dataset.situacao = "indisponivel";
  }

  resumoRegras.textContent = "Como interpretar a situação";
  const nomesSituacao = {
    normal: "Normal",
    atencao: "Atenção",
    alerta: "Alerta",
    inundacao: "Inundação",
  };
  Object.entries(ponto.regrasSituacaoVisual).forEach(([nome, descricao]) => {
    listaRegras.append(
      criarItemDetalhe(nomesSituacao[nome] ?? nome, descricao),
    );
  });
  regras.append(resumoRegras, listaRegras);

  tituloPontes.textContent = "Pontes sobre o arroio";
  avisoPontes.className = "selo-tipo-dado selo-dado-simulado";
  avisoPontes.textContent = "Situações simuladas para visualizar as cores";
  const situacoesTravessia = {
    transponivel: {
      texto: "Transponível",
      classe: "transponivel",
    },
    cuidado: {
      texto: "Cuidado: água no limite",
      classe: "cuidado",
    },
    intransponivel: {
      texto: "Intransponível",
      classe: "intransponivel",
    },
  };
  ponto.pontes.forEach((ponte) => {
    const item = document.createElement("li");
    const nome = document.createElement("span");
    const situacaoTravessia = document.createElement("strong");
    const estado = situacoesTravessia[ponte.situacaoTravessia] ?? {
      texto: "Aguardando observação",
      classe: "indisponivel",
    };

    item.id = ponte.id;
    nome.textContent = ponte.nome;
    situacaoTravessia.className = `situacao-travessia ${estado.classe}`;
    situacaoTravessia.textContent = ponte.dadoSimulado
      ? `${estado.texto} — simulação`
      : estado.texto;
    item.append(nome, situacaoTravessia);
    listaPontes.append(item);
  });

  cartao.append(
    selo,
    titulo,
    rotuloNivel,
    regras,
    tituloPontes,
    avisoPontes,
    listaPontes,
  );

  return cartao;
}

function criarCartaoEstacao(estacao) {
  const cartao = document.createElement("article");
  const numero = document.createElement("p");
  const titulo = document.createElement("h3");
  const natureza = document.createElement("p");
  const nivel = criarNivelEstacao(estacao);
  const expansivel = document.createElement("details");
  const resumo = document.createElement("summary");
  const detalhes = document.createElement("dl");

  cartao.className = "cartao-estacao";
  numero.className = "estacao-numero";
  numero.textContent = `Estação ${estacao.ordem}`;
  titulo.textContent = estacao.nome;
  natureza.className = "selo-tipo-dado selo-dado-simulado";
  natureza.textContent = estacao.medicaoSimulada
    ? "Dado simulado — não é leitura instrumental real"
    : "Medição instrumental — sem dado disponível";
  resumo.textContent = "Ver dados da estação";

  detalhes.append(
    criarItemDetalhe("Local", estacao.local ?? "A confirmar"),
    criarItemDetalhe("Tipo", formatarTipoEstacao(estacao.tipo)),
    criarItemDetalhe("Método de monitoramento", "Instrumental (sensores)"),
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

  if (estacao.medicaoSimulada) {
    detalhes.append(
      criarItemDetalhe(
        "Horário da medição simulada",
        formatarData(estacao.medicaoSimulada.medidoEm),
      ),
    );
  }

  expansivel.append(resumo, detalhes);
  cartao.append(titulo, numero, natureza, nivel, expansivel);

  return cartao;
}

function exibirEstacoes(estacoes) {
  const lista = document.querySelector("#lista-estacoes");
  const listaVisuais = document.querySelector("#lista-observacoes-visuais");
  const instrumentais = estacoes.filter(
    (estacao) => estacao.tipoMonitoramento !== "visual",
  );
  const visuais = estacoes.filter(
    (estacao) => estacao.tipoMonitoramento === "visual",
  );

  lista.replaceChildren(...instrumentais.map(criarCartaoEstacao));
  listaVisuais.replaceChildren(...visuais.map(criarCartaoObservacaoVisual));
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
    const listaVisuais = document.querySelector("#lista-observacoes-visuais");
    if (listaVisuais) {
      listaVisuais.innerHTML =
        "<p>Pontos de observação visual indisponíveis no momento.</p>";
    }
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
