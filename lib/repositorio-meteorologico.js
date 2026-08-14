const { bancoConfigurado, obterBanco } = require("./db");

async function obterEstacaoPlugfield(codigoExterno) {
  const sql = obterBanco();
  const linhas = await sql`
    SELECT e.id AS estacao_id, e.nome, e.codigo_externo
    FROM estacoes_monitoramento e
    JOIN fontes_dados f ON f.id = e.fonte_id
    WHERE f.codigo = 'PLUGFIELD' AND e.codigo_externo = ${codigoExterno}
    LIMIT 1
  `;

  if (!linhas[0]) {
    throw new Error(`Estação Plugfield ${codigoExterno} não cadastrada.`);
  }
  return linhas[0];
}

async function iniciarExecucaoColetaPlugfield(codigoExterno) {
  if (!bancoConfigurado()) return null;
  const sql = obterBanco();
  const { estacao_id: estacaoId } = await obterEstacaoPlugfield(codigoExterno);
  const fontes = await sql`
    SELECT fonte_id FROM estacoes_monitoramento WHERE id = ${estacaoId}
  `;
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
    VALUES (
      ${fontes[0].fonte_id},
      'executando',
      ${JSON.stringify({ codigoExterno })}::jsonb
    )
    RETURNING id
  `;
  return linhas[0].id;
}

async function finalizarExecucaoColetaPlugfield(id, dados) {
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

async function salvarMedicaoPlugfield(codigoExterno, medicao) {
  if (!bancoConfigurado()) return 0;
  const sql = obterBanco();
  const { estacao_id: estacaoId } = await obterEstacaoPlugfield(codigoExterno);
  const linhas = await sql`
    INSERT INTO medicoes_meteorologicas (
      estacao_id, medido_em, temperatura_c, sensacao_termica_c,
      ponto_orvalho_c, delta_t_c, umidade_percentual, vento_kmh,
      rajada_kmh, direcao_vento_graus, chuva_intervalo_mm, chuva_dia_mm,
      pressao_absoluta_hpa, pressao_relativa_hpa, luminosidade_lux,
      indice_uv, radiacao_solar_wm2, bateria_percentual,
      sinal_wifi_percentual, payload_original
    ) VALUES (
      ${estacaoId}, ${medicao.medidoEm}, ${medicao.temperatura},
      ${medicao.sensacaoTermica}, ${medicao.pontoOrvalho}, ${medicao.deltaT},
      ${medicao.umidade}, ${medicao.vento}, ${medicao.rajada},
      ${medicao.direcaoVento}, ${medicao.chuvaIntervalo}, ${medicao.chuvaDia},
      ${medicao.pressaoAbsoluta}, ${medicao.pressaoRelativa},
      ${medicao.luminosidade}, ${medicao.indiceUv}, ${medicao.radiacaoSolar},
      ${medicao.bateria}, ${medicao.sinalWifi}, ${JSON.stringify(medicao.payload)}::jsonb
    )
    ON CONFLICT (estacao_id, medido_em) DO NOTHING
    RETURNING id
  `;
  return linhas.length;
}

async function obterUltimaMedicaoPlugfield(codigoExterno) {
  if (!bancoConfigurado()) return null;
  const sql = obterBanco();
  const linhas = await sql`
    SELECT m.*, e.nome, e.codigo_externo
    FROM medicoes_meteorologicas m
    JOIN estacoes_monitoramento e ON e.id = m.estacao_id
    JOIN fontes_dados f ON f.id = e.fonte_id
    WHERE f.codigo = 'PLUGFIELD' AND e.codigo_externo = ${codigoExterno}
    ORDER BY m.medido_em DESC
    LIMIT 1
  `;
  return linhas[0] ?? null;
}

async function obterAcumuladosChuvaPlugfield(codigoExterno) {
  if (!bancoConfigurado()) return null;
  const sql = obterBanco();
  const linhas = await sql`
    WITH dados AS (
      SELECT m.medido_em, m.chuva_intervalo_mm
      FROM medicoes_meteorologicas m
      JOIN estacoes_monitoramento e ON e.id = m.estacao_id
      JOIN fontes_dados f ON f.id = e.fonte_id
      WHERE f.codigo = 'PLUGFIELD' AND e.codigo_externo = ${codigoExterno}
    ), referencia AS (
      SELECT max(medido_em) AS fim, min(medido_em) AS inicio FROM dados
    )
    SELECT
      referencia.fim AS referencia_em,
      referencia.inicio AS inicio_historico,
      COALESCE(sum(chuva_intervalo_mm) FILTER (
        WHERE medido_em > referencia.fim - INTERVAL '30 minutes'
      ), 0) AS ultimos_30_min,
      COALESCE(sum(chuva_intervalo_mm) FILTER (
        WHERE medido_em > referencia.fim - INTERVAL '1 hour'
      ), 0) AS ultima_hora,
      COALESCE(sum(chuva_intervalo_mm) FILTER (
        WHERE medido_em > referencia.fim - INTERVAL '12 hours'
      ), 0) AS ultimas_12_horas,
      COALESCE(sum(chuva_intervalo_mm) FILTER (
        WHERE medido_em > referencia.fim - INTERVAL '24 hours'
      ), 0) AS ultimas_24_horas
    FROM dados CROSS JOIN referencia
    GROUP BY referencia.fim, referencia.inicio
  `;
  return linhas[0] ?? null;
}

module.exports = {
  bancoConfigurado,
  finalizarExecucaoColetaPlugfield,
  iniciarExecucaoColetaPlugfield,
  obterAcumuladosChuvaPlugfield,
  obterUltimaMedicaoPlugfield,
  salvarMedicaoPlugfield,
};
