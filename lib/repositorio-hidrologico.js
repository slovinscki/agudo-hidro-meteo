const { bancoConfigurado, obterBanco } = require("./db");

async function obterFonteEEstacao(codigoEstacao) {
  const sql = obterBanco();
  const linhas = await sql`
    SELECT e.id AS estacao_id, f.id AS fonte_id
    FROM estacoes_monitoramento e
    JOIN fontes_dados f ON f.id = e.fonte_id
    WHERE f.codigo = 'ANA' AND e.codigo_externo = ${codigoEstacao}
    LIMIT 1
  `;

  if (!linhas[0]) {
    throw new Error(`Estação ANA ${codigoEstacao} não cadastrada no banco.`);
  }

  return linhas[0];
}

async function iniciarExecucaoColeta(codigoEstacao) {
  if (!bancoConfigurado()) return null;
  const sql = obterBanco();
  const { fonte_id: fonteId } = await obterFonteEEstacao(codigoEstacao);
  const linhas = await sql`
    INSERT INTO execucoes_coleta (fonte_id, status, metadados)
    VALUES (${fonteId}, 'executando', ${JSON.stringify({ codigoEstacao })}::jsonb)
    RETURNING id
  `;
  return linhas[0].id;
}

async function finalizarExecucaoColeta(id, dados) {
  if (!id || !bancoConfigurado()) return;
  const sql = obterBanco();
  await sql`
    UPDATE execucoes_coleta
    SET finalizado_em = NOW(),
        status = ${dados.status},
        quantidade_recebida = ${dados.quantidadeRecebida ?? 0},
        quantidade_inserida = ${dados.quantidadeInserida ?? 0},
        mensagem_erro = ${dados.mensagemErro ?? null}
    WHERE id = ${id}
  `;
}

async function salvarMedicoesAna(codigoEstacao, medicoes, conversores) {
  if (!bancoConfigurado()) return 0;
  const sql = obterBanco();
  const { estacao_id: estacaoId } = await obterFonteEEstacao(codigoEstacao);
  let inseridas = 0;

  for (const medicao of medicoes) {
    const nivelCm = conversores.numero(medicao.Cota_Adotada);
    const medidoEm = medicao.Data_Hora_Medicao;
    if (!medidoEm || nivelCm === null) continue;

    const resultado = await sql`
      INSERT INTO medicoes_hidrologicas (
        estacao_id, medido_em, nivel_metros, chuva_mm, vazao_m3s,
        qualidade_nivel, qualidade_chuva, qualidade_vazao, payload_original
      ) VALUES (
        ${estacaoId}, ${medidoEm}, ${nivelCm / 100},
        ${conversores.numero(medicao.Chuva_Adotada)},
        ${conversores.numero(medicao.Vazao_Adotada)},
        ${conversores.qualidade(medicao.Cota_Adotada_Status)},
        ${conversores.qualidade(medicao.Chuva_Adotada_Status)},
        ${conversores.qualidade(medicao.Vazao_Adotada_Status)},
        ${JSON.stringify(medicao)}::jsonb
      )
      ON CONFLICT (estacao_id, medido_em) DO NOTHING
      RETURNING id
    `;
    inseridas += resultado.length;
  }

  return inseridas;
}

async function obterUltimasMedicoes(codigoEstacao, limite = 200) {
  if (!bancoConfigurado()) return [];
  const sql = obterBanco();
  return sql`
    SELECT m.*
    FROM medicoes_hidrologicas m
    JOIN estacoes_monitoramento e ON e.id = m.estacao_id
    JOIN fontes_dados f ON f.id = e.fonte_id
    WHERE f.codigo = 'ANA' AND e.codigo_externo = ${codigoEstacao}
    ORDER BY m.medido_em DESC
    LIMIT ${limite}
  `;
}

module.exports = {
  bancoConfigurado,
  finalizarExecucaoColeta,
  iniciarExecucaoColeta,
  obterUltimasMedicoes,
  salvarMedicoesAna,
};
