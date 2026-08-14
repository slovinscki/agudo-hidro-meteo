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
  await sql`
    UPDATE execucoes_coleta
    SET finalizado_em = NOW(),
        status = 'erro',
        mensagem_erro = COALESCE(
          mensagem_erro,
          'Execução encerrada automaticamente após exceder o tempo limite.'
        )
    WHERE status = 'executando'
      AND iniciado_em < NOW() - INTERVAL '1 hour'
  `;
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
    WHERE id = ${id} AND status = 'executando'
  `;
}

async function salvarMedicoesAna(codigoEstacao, medicoes, conversores) {
  if (!bancoConfigurado()) return 0;
  const sql = obterBanco();
  const { estacao_id: estacaoId } = await obterFonteEEstacao(codigoEstacao);
  const registros = medicoes.flatMap((medicao) => {
    const nivelCm = conversores.numero(medicao.Cota_Adotada);
    const medidoEm = medicao.Data_Hora_Medicao;
    if (!medidoEm || nivelCm === null) return [];

    return [{
      medido_em: medidoEm,
      nivel_metros: nivelCm / 100,
      chuva_mm: conversores.numero(medicao.Chuva_Adotada),
      vazao_m3s: conversores.numero(medicao.Vazao_Adotada),
      qualidade_nivel: conversores.qualidade(medicao.Cota_Adotada_Status),
      qualidade_chuva: conversores.qualidade(medicao.Chuva_Adotada_Status),
      qualidade_vazao: conversores.qualidade(medicao.Vazao_Adotada_Status),
      payload_original: medicao,
    }];
  });

  if (registros.length === 0) return 0;

  const resultado = await sql`
    INSERT INTO medicoes_hidrologicas (
      estacao_id, medido_em, nivel_metros, chuva_mm, vazao_m3s,
      qualidade_nivel, qualidade_chuva, qualidade_vazao, payload_original
    )
    SELECT
      ${estacaoId}, registro.medido_em, registro.nivel_metros,
      registro.chuva_mm, registro.vazao_m3s, registro.qualidade_nivel,
      registro.qualidade_chuva, registro.qualidade_vazao,
      registro.payload_original
    FROM jsonb_to_recordset(${JSON.stringify(registros)}::jsonb) AS registro(
      medido_em TIMESTAMPTZ,
      nivel_metros NUMERIC,
      chuva_mm NUMERIC,
      vazao_m3s NUMERIC,
      qualidade_nivel TEXT,
      qualidade_chuva TEXT,
      qualidade_vazao TEXT,
      payload_original JSONB
    )
    ON CONFLICT (estacao_id, medido_em) DO NOTHING
    RETURNING id
  `;

  return resultado.length;
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
      AND COALESCE(m.payload_original->>'Data_Hora_Medicao', '')
        ~ '(Z|[+-][0-9]{2}:?[0-9]{2})$'
    ORDER BY m.medido_em DESC
    LIMIT ${limite}
  `;
}

async function obterAcumuladosChuvaAna(codigoEstacao) {
  if (!bancoConfigurado()) return null;
  const sql = obterBanco();
  const linhas = await sql`
    WITH dados AS (
      SELECT m.medido_em, m.chuva_mm
      FROM medicoes_hidrologicas m
      JOIN estacoes_monitoramento e ON e.id = m.estacao_id
      JOIN fontes_dados f ON f.id = e.fonte_id
      WHERE f.codigo = 'ANA' AND e.codigo_externo = ${codigoEstacao}
    ), referencia AS (
      SELECT max(medido_em) AS fim, min(medido_em) AS inicio FROM dados
    )
    SELECT
      referencia.fim AS referencia_em,
      referencia.inicio AS inicio_historico,
      COALESCE(sum(chuva_mm) FILTER (
        WHERE medido_em > referencia.fim - INTERVAL '30 minutes'
      ), 0) AS ultimos_30_min,
      COALESCE(sum(chuva_mm) FILTER (
        WHERE medido_em > referencia.fim - INTERVAL '1 hour'
      ), 0) AS ultima_hora,
      COALESCE(sum(chuva_mm) FILTER (
        WHERE medido_em > referencia.fim - INTERVAL '12 hours'
      ), 0) AS ultimas_12_horas,
      COALESCE(sum(chuva_mm) FILTER (
        WHERE medido_em > referencia.fim - INTERVAL '24 hours'
      ), 0) AS ultimas_24_horas
    FROM dados CROSS JOIN referencia
    GROUP BY referencia.fim, referencia.inicio
  `;
  return linhas[0] ?? null;
}

module.exports = {
  bancoConfigurado,
  finalizarExecucaoColeta,
  iniciarExecucaoColeta,
  obterAcumuladosChuvaAna,
  obterUltimasMedicoes,
  salvarMedicoesAna,
};
