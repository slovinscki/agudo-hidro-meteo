const CAMINHO_DADOS = "data/dados.json";
const CAMINHO_ESTACOES = "data/estacoes.json";
const CAMINHO_ANA = "/api/ana";
const CAMINHO_INMET = "/api/inmet";
const CAMINHO_PLUGFIELD = "/api/plugfield";
const CAMINHO_DFESA = "/api/dfesa";

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

function formatarDataCurta(data) {
  if (!data) return "Horário não informado";
  const instante = new Date(data);
  if (Number.isNaN(instante.getTime())) return String(data);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(instante);
}

function criarCartaoAvisoInmet(aviso) {
  const cartao = document.createElement("article");
  const cabecalho = document.createElement("div");
  const titulo = document.createElement("h3");
  const severidade = document.createElement("strong");
  const validade = document.createElement("p");
  const riscos = document.createElement("p");
  const instrucoes = document.createElement("p");
  const link = document.createElement("a");

  cartao.className = "cartao-aviso-inmet";
  cartao.dataset.severidade = aviso.severidade.toLocaleLowerCase("pt-BR");
  cabecalho.className = "aviso-inmet-cabecalho";
  titulo.textContent = aviso.evento;
  severidade.textContent = aviso.severidade;
  validade.textContent = `Válido de ${formatarDataCurta(aviso.inicio)} até ${formatarDataCurta(aviso.fim)}.`;
  riscos.textContent = aviso.riscos || "Riscos potenciais não informados pela fonte.";
  instrucoes.textContent = aviso.instrucoes || "Consulte o aviso completo para orientações.";
  link.href = aviso.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Ver aviso oficial completo";

  cabecalho.append(titulo, severidade);
  cartao.append(cabecalho, validade, riscos, instrucoes, link);
  return cartao;
}

async function carregarAvisosInmet() {
  const lista = document.querySelector("#lista-avisos-inmet");
  try {
    const resposta = await fetch(CAMINHO_INMET);
    if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
    const dados = await resposta.json();

    if (dados.avisos.length === 0) {
      atualizarTexto("avisos-inmet-status", "Não há aviso ativo do INMET para Agudo nesta consulta.");
      lista.replaceChildren();
      return;
    }

    atualizarTexto(
      "avisos-inmet-status",
      `${dados.avisos.length} ${dados.avisos.length === 1 ? "aviso ativo" : "avisos ativos"} para o município.`,
    );
    lista.replaceChildren(...dados.avisos.map(criarCartaoAvisoInmet));
  } catch (erro) {
    console.error("Não foi possível carregar os avisos do INMET:", erro);
    atualizarTexto(
      "avisos-inmet-status",
      "Avisos do INMET indisponíveis nesta consulta. Verifique o canal oficial.",
    );
    lista.replaceChildren();
  }
}

function formatarTempoAteCota(horasTotais) {
  const horasArredondadas = Math.max(1, Math.ceil(horasTotais));

  if (horasTotais < 30) {
    return `${horasArredondadas} ${horasArredondadas === 1 ? "hora" : "horas"}`;
  }

  const dias = Math.floor(horasArredondadas / 24);
  const horas = horasArredondadas % 24;

  if (horas === 0) {
    return `${dias} ${dias === 1 ? "dia" : "dias"}`;
  }

  return `${dias} ${dias === 1 ? "dia" : "dias"} e ${horas} ${horas === 1 ? "hora" : "horas"}`;
}

function calcularTempoAteReferencia(
  nivel,
  cota,
  taxaVariacaoCmHora,
  textoAtingida,
) {
  if (typeof cota !== "number") return "referência não cadastrada";
  if (nivel >= cota) return textoAtingida;
  if (typeof taxaVariacaoCmHora !== "number") {
    return "indisponível sem velocidade calculada";
  }
  if (taxaVariacaoCmHora <= 0) {
    return "sem previsão enquanto o nível não estiver subindo";
  }

  return formatarTempoAteCota(((cota - nivel) * 100) / taxaVariacaoCmHora);
}

function atualizarBarraPercentualCota(
  percentual,
  _taxaVariacaoCmHora,
  bloqueioTotalSangrador = false,
) {
  const barra = document.querySelector("#barra-percentual-cota");
  if (!barra) return;

  if (!Number.isFinite(percentual)) {
    barra.hidden = true;
    return;
  }

  const percentualLimitado = Math.min(100, Math.max(0, percentual));
  let estado = "verde";
  let descricao = "Nível normal, abaixo da faixa de atenção";

  if (bloqueioTotalSangrador) {
    estado = "vermelho";
    descricao =
      percentual >= 100
        ? "Cota de inundação de Dona Francisca atingida e Sangrador bloqueado"
        : "Bloqueio total do Sangrador para qualquer tipo de veículo";
  } else if (percentual >= 90) {
    estado = "amarelo";
    descricao = "Atenção: nível a partir de 90% da referência do Sangrador";
  }

  barra.hidden = false;
  barra.dataset.estado = estado;
  barra.setAttribute("aria-valuenow", String(Math.round(percentualLimitado)));
  barra.setAttribute("aria-valuetext", `${Math.round(percentual)}%. ${descricao}.`);
  barra.querySelector("span").style.width = `${percentualLimitado}%`;
}

function exibirProjecaoNivel(nivel, medicao, dadosAna) {
  const cotaInundacao = medicao.cotaInundacao;
  const cotaBloqueioSangrador = medicao.cotaBloqueioSangrador;
  const taxaVariacaoCmHora =
    dadosAna?.medicao?.taxaVariacaoCmHora ?? medicao.taxaVariacaoCmHora;
  const tendencia = dadosAna?.medicao?.tendencia ?? medicao.tendencia;

  if (typeof cotaInundacao !== "number") {
    atualizarTexto("resumo-percentual-cota", "Cota não cadastrada");
    atualizarTexto("resumo-tempo-cota", "Indisponível");
    atualizarBarraPercentualCota(Number.NaN, taxaVariacaoCmHora);
  } else {
    const percentual = (nivel / cotaInundacao) * 100;
    atualizarTexto(
      "resumo-percentual-cota",
      `${Math.round(percentual)}% de ${formatarNumero(cotaInundacao)} m`,
    );
    const bloqueioTotalSangrador =
      typeof cotaBloqueioSangrador === "number" &&
      nivel >= cotaBloqueioSangrador;
    atualizarBarraPercentualCota(
      percentual,
      taxaVariacaoCmHora,
      bloqueioTotalSangrador,
    );

    if (bloqueioTotalSangrador) {
      atualizarTexto(
        "resumo-percentual-cota",
        `${Math.round(percentual)}% da cota de inundação de Dona Francisca (${formatarNumero(cotaInundacao)} m) · Sangrador bloqueado para qualquer tipo de veículo a partir de ${formatarNumero(cotaBloqueioSangrador)} m`,
      );
    } else {
      atualizarTexto(
        "resumo-percentual-cota",
        `${Math.round(percentual)}% da cota de inundação de Dona Francisca (${formatarNumero(cotaInundacao)} m)`,
      );
    }

    const tempoSangrador = calcularTempoAteReferencia(
      nivel,
      cotaBloqueioSangrador,
      taxaVariacaoCmHora,
      "atingida — passagem bloqueada para qualquer veículo",
    );
    const tempoDonaFrancisca = calcularTempoAteReferencia(
      nivel,
      cotaInundacao,
      taxaVariacaoCmHora,
      "atingida — início da inundação do parque da cidade",
    );

    atualizarTexto(
      "resumo-tempo-cota",
      `Sangrador (${formatarNumero(cotaBloqueioSangrador)} m): ${tempoSangrador} · Dona Francisca / parque da cidade (${formatarNumero(cotaInundacao)} m): ${tempoDonaFrancisca}`,
    );
  }

  if (typeof taxaVariacaoCmHora === "number") {
    const sinal = taxaVariacaoCmHora > 0 ? "+" : "";
    atualizarTexto(
      "resumo-velocidade-nivel",
      `${sinal}${formatarNumero(taxaVariacaoCmHora)} cm/h · ${tendencia ?? "tendência indefinida"}`,
    );
  } else {
    atualizarTexto("resumo-velocidade-nivel", "Indisponível");
  }
}

function definirEstadoResumoNivel(nivel, medicao, dadosAna) {
  const resumoNivel = document.querySelector("#resumo-nivel");

  if (!resumoNivel) {
    return;
  }

  const cotaInundacao = medicao.cotaInundacao;
  const cotaBloqueioSangrador = medicao.cotaBloqueioSangrador;
  const taxaVariacaoCmHora =
    dadosAna?.medicao?.taxaVariacaoCmHora ?? medicao.taxaVariacaoCmHora;
  const taxaVariacaoMetrosHora = taxaVariacaoCmHora / 100;
  const horasAteCota =
    typeof cotaInundacao === "number" && taxaVariacaoMetrosHora > 0
      ? (cotaInundacao - nivel) / taxaVariacaoMetrosHora
      : Number.POSITIVE_INFINITY;

  let estado = "neutro";
  const percentualCota =
    typeof cotaInundacao === "number" ? (nivel / cotaInundacao) * 100 : null;

  if (
    (typeof percentualCota === "number" && percentualCota >= 100) ||
    (typeof cotaBloqueioSangrador === "number" &&
      nivel >= cotaBloqueioSangrador)
  ) {
    estado = "vermelho";
  } else if (
    typeof percentualCota === "number" &&
    (percentualCota >= 90 || (horasAteCota >= 0 && horasAteCota <= 2))
  ) {
    estado = "laranja";
  } else if (typeof percentualCota === "number") {
    estado = "verde";
  }

  resumoNivel.dataset.estado = estado;
}

function avaliarImpactoEstrada(nivel, regras) {
  if (regras.tipoRegra === "bloqueio_total") {
    if (nivel >= regras.limiteBloqueio) {
      return {
        status: "todos",
        texto: `Bloqueio total para qualquer tipo de veículo indicado a partir de ${formatarNumero(regras.limiteBloqueio)} m.`,
      };
    }

    return {
      status: "sem-bloqueio",
      texto: "Sem bloqueio indicado por esta referência de nível.",
    };
  }

  return {
    status: "indisponivel",
    texto: "Não há regra operacional validada para esta via.",
  };
}

function exibirImpactoEstradas(nivel, unidade, regras) {
  atualizarTexto("nivel-estradas", `${formatarNumero(nivel)} ${unidade}`);
  atualizarTexto(
    "fonte-regras-estradas",
    regras.map((regra) => regra.fonte).filter(Boolean).join("; ") ||
      "Referência não cadastrada",
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
    criarItemDetalhe(
      "Balanço afluência − defluência",
      formatarMedida(usina.balancoVazao, usina.unidadeVazao),
    ),
    criarItemDetalhe(
      "Referências de vazão",
      typeof usina.limiteAtencao === "number" &&
        typeof usina.limiteInundacao === "number"
        ? `Atenção: ${formatarNumero(usina.limiteAtencao)} m³/s · Inundação: ${formatarNumero(usina.limiteInundacao)} m³/s`
        : "Não informadas",
    ),
    criarItemDetalhe("Fonte", usina.fonte),
  );

  atualizacao.className = "usina-atualizacao";
  atualizacao.textContent = usina.atualizadoEm
    ? `Atualizado em ${formatarData(usina.atualizadoEm)}`
    : "Sem medição disponível — aguardando acesso à API oficial";
  cartao.dataset.estado = usina.atualizadoEm
    ? usina.classificacaoDefluencia ?? "normal"
    : "indisponivel";
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
  const donaFrancisca = usinas.find(
    (usina) => usina.id === "usina-dona-francisca",
  );
  const situacao = document.querySelector("#situacao-liberacao-usinas");
  const resumo = document.querySelector("#resumo-liberacao-usinas");

  if (!donaFrancisca || typeof donaFrancisca.defluencia !== "number") {
    atualizarTexto(
      "situacao-liberacao-usinas",
      "Defluência da UHE Dona Francisca indisponível.",
    );
    atualizarTexto(
      "efeito-liberacao-usinas",
      "Não foi possível avaliar a influência da usina no trecho a jusante.",
    );
    resumo.dataset.estado = "indisponivel";
    return;
  }

  const classificacao = donaFrancisca.classificacaoDefluencia ?? "normal";
  const textos = {
    normal: "Defluência abaixo da referência de atenção de 3.000 m³/s.",
    atencao: "Defluência no nível de atenção: entre 3.000 e 3.499 m³/s.",
    inundacao: "Defluência no nível de inundação: 3.500 m³/s ou mais.",
  };

  atualizarTexto(
    "situacao-liberacao-usinas",
    textos[classificacao] ?? textos.normal,
  );
  atualizarTexto(
    "efeito-liberacao-usinas",
    donaFrancisca.balancoVazao < 0
      ? "A usina está liberando mais água do que recebe. Isso tende a reduzir o armazenamento, mas a defluência continua influenciando diretamente o rio a jusante."
      : "A usina está recebendo pelo menos tanta água quanto libera. O reservatório tende a armazenar água, sujeito a chuva, vertimento e operação.",
  );
  situacao.dataset.estado = classificacao;
  resumo.dataset.estado = classificacao;
}

function integrarDadosDfesa(usinas, dadosDfesa) {
  if (!dadosDfesa?.medicao) return usinas;

  return usinas.map((usina) =>
    usina.id !== "usina-dona-francisca"
      ? usina
      : {
          ...usina,
          tipo: "Dados horários da página pública da DFESA",
          fonte: dadosDfesa.fonte,
          urlFonte: dadosDfesa.urlFonte,
          atualizadoEm: dadosDfesa.medicao.medidoEm,
          nivelReservatorio: dadosDfesa.medicao.nivelReservatorio,
          nivelJusante: dadosDfesa.medicao.nivelJusante,
          afluencia: dadosDfesa.medicao.afluencia,
          defluencia: dadosDfesa.medicao.defluencia,
          vazaoTurbinada: dadosDfesa.medicao.vazaoTurbinada,
          vazaoVertida: dadosDfesa.medicao.vazaoVertida,
          balancoVazao: dadosDfesa.balanco?.diferenca,
          tendenciaArmazenamento: dadosDfesa.balanco?.tendenciaArmazenamento,
          classificacaoDefluencia: dadosDfesa.classificacaoDefluencia,
          limiteAtencao: dadosDfesa.limites?.atencao,
          limiteInundacao: dadosDfesa.limites?.inundacao,
        },
  );
}

function exibirDados(dados, dadosAna = null, dadosDfesa = null) {
  if (
    typeof dadosAna?.medicao?.nivelRio?.valor !== "number" ||
    !dadosAna?.medicao?.medidoEm
  ) {
    exibirErro();
    return;
  }

  const { estacao, medicao, impactoEstradas, usinas } = dados;
  const nivel = dadosAna.medicao.nivelRio.valor;
  const unidadeNivel = dadosAna.medicao.nivelRio.unidade;
  const medidoEm = dadosAna.medicao.medidoEm;
  const nomeEstacao = dadosAna.estacao.nome;
  const fonteNivel = dadosAna.fonte;
  const estaDesatualizado =
    dadosAna.persistencia?.situacaoAtualizacao === "desatualizado";
  const statusNivel = estaDesatualizado
    ? `Dado instrumental desatualizado — qualidade: ${dadosAna.medicao.nivelRio.qualidade}`
    : `Dado instrumental atualizado — qualidade: ${dadosAna.medicao.nivelRio.qualidade}`;
  const tendencia = dadosAna.medicao.tendencia ?? "Ainda não calculada";
  const nivelFormatado = `${formatarNumero(nivel)} ${unidadeNivel}`;
  const horarioFormatado = formatarData(medidoEm);

  atualizarTexto("resumo-nivel", nivelFormatado);
  atualizarTexto("resumo-horario", horarioFormatado);
  atualizarTexto("resumo-status", statusNivel);
  atualizarTexto("nivel-atual", nivelFormatado);
  atualizarTexto("nome-estacao", nomeEstacao);
  atualizarTexto("tendencia-nivel", tendencia);
  atualizarTexto("horario-nivel", horarioFormatado);
  atualizarTexto("status-nivel", statusNivel);
  atualizarTexto("fonte-nivel", fonteNivel);
  atualizarTexto("chuva-24h", "Dados instrumentais indisponíveis");

  definirEstadoResumoNivel(nivel, medicao, dadosAna);
  exibirProjecaoNivel(nivel, medicao, dadosAna);

  document.querySelector("#resumo-horario").dateTime = medidoEm;

  exibirImpactoEstradas(
    nivel,
    unidadeNivel,
    impactoEstradas,
  );
  const usinasAtualizadas = integrarDadosDfesa(usinas, dadosDfesa);
  exibirUsinas(usinasAtualizadas);
  exibirResumoLiberacaoUsinas(usinasAtualizadas);
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
  atualizarTexto("resumo-percentual-cota", mensagem);
  atualizarBarraPercentualCota(Number.NaN, null);
  atualizarTexto("resumo-velocidade-nivel", mensagem);
  atualizarTexto("resumo-tempo-cota", mensagem);
  document.querySelector("#resumo-nivel")?.removeAttribute("data-estado");
}

function criarLinhaChuva(estacao, dadosAna = null, dadosPlugfield = null) {
  const linha = document.createElement("div");
  const nome = document.createElement("dt");
  const valor = document.createElement("dd");
  const codigo = String(estacao.codigoExterno ?? "");
  let precipitacao = null;
  let unidade = "mm";
  let medidoEm = null;
  let acumulados = null;
  let rotuloMedida = "Na última medição";

  if (estacao.id === "estacao-1") {
    precipitacao = dadosAna?.medicao?.precipitacao?.valor;
    unidade = dadosAna?.medicao?.precipitacao?.unidade ?? unidade;
    medidoEm = dadosAna?.medicao?.medidoEm;
    acumulados = dadosAna?.medicao?.chuvaAcumulada;
  } else if (
    dadosPlugfield &&
    codigo &&
    codigo === String(dadosPlugfield.estacao?.codigo ?? "")
  ) {
    precipitacao = dadosPlugfield.medicao?.chuvaDia?.valor;
    unidade = dadosPlugfield.medicao?.chuvaDia?.unidade ?? unidade;
    medidoEm = dadosPlugfield.medicao?.medidoEm;
    acumulados = dadosPlugfield.medicao?.chuvaAcumulada;
    rotuloMedida = "Acumulado do dia";
  }

  nome.textContent = `Estação ${estacao.ordem} — ${estacao.nome}`;
  if (typeof precipitacao === "number") {
    const medida = document.createElement("strong");
    const rotulo = document.createElement("span");
    const horario = document.createElement("small");
    rotulo.className = "chuva-medida-rotulo";
    rotulo.textContent = rotuloMedida;
    medida.textContent = `${formatarNumero(precipitacao)} ${unidade}`;
    horario.textContent = medidoEm
      ? `Atualizado em ${formatarData(medidoEm)}`
      : "Horário não informado";
    valor.append(rotulo, medida, horario);

    if (acumulados) {
      const listaAcumulados = document.createElement("dl");
      const periodos = [
        ["Últimos 30 min", acumulados.ultimos30Min],
        ["Última hora", acumulados.ultimaHora],
        ["Últimas 12 horas", acumulados.ultimas12Horas],
        ["Últimas 24 horas", acumulados.ultimas24Horas],
      ];
      listaAcumulados.className = "chuva-acumulados";
      periodos.forEach(([periodo, acumulado]) => {
        const grupo = document.createElement("div");
        const termo = document.createElement("dt");
        const descricao = document.createElement("dd");
        termo.textContent = periodo;
        descricao.textContent = acumulado?.completo
          ? `${formatarNumero(acumulado.valor)} ${acumulado.unidade}`
          : "Histórico insuficiente";
        grupo.append(termo, descricao);
        listaAcumulados.append(grupo);
      });
      valor.append(listaAcumulados);
    }
    linha.dataset.estado = "disponivel";
  } else {
    valor.textContent = "Dados de chuva indisponíveis";
    linha.dataset.estado = "indisponivel";
  }

  linha.append(nome, valor);
  return linha;
}

function exibirChuvaMonitorada(estacoes, dadosAna = null, dadosPlugfield = null) {
  const lista = document.querySelector("#lista-chuva-monitorada");
  if (!lista) return;
  const instrumentais = estacoes
    .filter((estacao) => estacao.tipoMonitoramento !== "visual")
    .slice(0, 4);
  lista.replaceChildren(
    ...instrumentais.map((estacao) =>
      criarLinhaChuva(estacao, dadosAna, dadosPlugfield),
    ),
  );
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
  const medicao = estacao.medicaoAtual;

  bloco.className = "nivel-estacao";
  rotulo.textContent = medicao
    ? "Nível instrumental"
    : "Medição instrumental";

  if (!medicao) {
    valor.textContent = "Não disponível";
    contexto.textContent = estacao.posicionadaEmRio
      ? "Sem dado instrumental disponível"
      : "Esta estação não está posicionada em rio";
    bloco.dataset.estado = "indisponivel";
  } else {
    valor.textContent = `${formatarNumero(medicao.nivelRio)} ${medicao.unidade}`;
    contexto.textContent = `Medido em ${formatarData(medicao.medidoEm)} — qualidade: ${medicao.qualidade}`;
    bloco.dataset.estado = "instrumental";
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
  avisoPontes.className = "selo-tipo-dado";
  avisoPontes.textContent = ponto.pontes.length
    ? "Situações informadas por observação visual"
    : "Nenhuma situação de ponte informada";
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
    situacaoTravessia.textContent = estado.texto;
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
  natureza.className = "selo-tipo-dado";
  natureza.textContent = estacao.medicaoAtual
    ? "Dado instrumental"
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

  if (estacao.medicaoAtual) {
    detalhes.append(
      criarItemDetalhe(
        "Precipitação na medição",
        formatarMedida(
          estacao.medicaoAtual.precipitacao,
          estacao.medicaoAtual.unidadePrecipitacao,
        ),
      ),
      criarItemDetalhe(
        "Vazão",
        formatarMedida(
          estacao.medicaoAtual.vazao,
          estacao.medicaoAtual.unidadeVazao,
        ),
      ),
    );
  }

  expansivel.append(resumo, detalhes);
  cartao.append(titulo, numero, natureza, nivel, expansivel);

  return cartao;
}

function exibirEstacoes(estacoes, dadosAna = null) {
  const lista = document.querySelector("#lista-estacoes");
  const listaVisuais = document.querySelector("#lista-observacoes-visuais");
  const estacoesAtualizadas = estacoes.map((estacao) => {
    if (estacao.id !== "estacao-1" || !dadosAna) {
      return estacao;
    }

    return {
      ...estacao,
      naturezaDado: "instrumental",
      medicaoAtual: {
        nivelRio: dadosAna.medicao.nivelRio.valor,
        unidade: dadosAna.medicao.nivelRio.unidade,
        qualidade: dadosAna.medicao.nivelRio.qualidade,
        medidoEm: dadosAna.medicao.medidoEm,
        precipitacao: dadosAna.medicao.precipitacao.valor,
        unidadePrecipitacao: dadosAna.medicao.precipitacao.unidade,
        vazao: dadosAna.medicao.vazao.valor,
        unidadeVazao: dadosAna.medicao.vazao.unidade,
      },
    };
  });
  const instrumentais = estacoesAtualizadas.filter(
    (estacao) => estacao.tipoMonitoramento !== "visual",
  );
  const visuais = estacoesAtualizadas.filter(
    (estacao) => estacao.tipoMonitoramento === "visual",
  );

  lista.replaceChildren(...instrumentais.map(criarCartaoEstacao));
  listaVisuais.replaceChildren(...visuais.map(criarCartaoObservacaoVisual));
}

async function carregarEstacoes(dadosAna = null, dadosPlugfield = null) {
  const lista = document.querySelector("#lista-estacoes");

  try {
    const resposta = await fetch(CAMINHO_ESTACOES, { cache: "no-store" });

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const estacoes = await resposta.json();
    exibirEstacoes(estacoes, dadosAna);
    exibirChuvaMonitorada(estacoes, dadosAna, dadosPlugfield);
  } catch (erro) {
    console.error("Não foi possível carregar as estações:", erro);
    lista.innerHTML = "<p>Estações indisponíveis no momento.</p>";
    const listaChuvas = document.querySelector("#lista-chuva-monitorada");
    if (listaChuvas) {
      listaChuvas.innerHTML =
        "<div data-estado=\"indisponivel\"><dt>Estações indisponíveis</dt><dd>Não foi possível consultar os dados de chuva.</dd></div>";
    }
    const listaVisuais = document.querySelector("#lista-observacoes-visuais");
    if (listaVisuais) {
      listaVisuais.innerHTML =
        "<p>Pontos de observação visual indisponíveis no momento.</p>";
    }
  }
}

async function carregarDados() {
  try {
    const [resposta, respostaAna, respostaPlugfield, respostaDfesa] = await Promise.all([
      fetch(CAMINHO_DADOS),
      fetch(CAMINHO_ANA, { cache: "no-store" }).catch(() => null),
      fetch(CAMINHO_PLUGFIELD, { cache: "no-store" }).catch(() => null),
      fetch(CAMINHO_DFESA, { cache: "no-store" }).catch(() => null),
    ]);

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const dados = await resposta.json();
    const dadosAna = respostaAna?.ok ? await respostaAna.json() : null;
    const dadosPlugfield = respostaPlugfield?.ok
      ? await respostaPlugfield.json()
      : null;
    const dadosDfesa = respostaDfesa?.ok ? await respostaDfesa.json() : null;
    exibirDados(dados, dadosAna, dadosDfesa);
    await carregarEstacoes(dadosAna, dadosPlugfield);
  } catch (erro) {
    console.error("Não foi possível carregar os dados:", erro);
    exibirErro();
  }
}

carregarDados();
carregarAvisosInmet();
