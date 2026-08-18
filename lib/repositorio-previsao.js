const { bancoConfigurado, obterBanco } = require("./db");

async function salvarPrevisao(previsao, payloadOriginal) {
  if (!bancoConfigurado()) return 0;
  const sql = obterBanco();
  const linhas = await sql`
    INSERT INTO previsoes_meteorologicas (
      fonte_id, local_codigo, emitido_em, inicio_em, fim_em, modelo,
      previsao_normalizada, payload_original
    )
    SELECT
      f.id, ${previsao.local.codigo}, ${previsao.emitidoEm},
      ${previsao.inicioEm}, ${previsao.fimEm}, ${previsao.modelo},
      ${JSON.stringify(previsao)}::jsonb, ${JSON.stringify(payloadOriginal)}::jsonb
    FROM fontes_dados f
    WHERE f.codigo = ${previsao.fonte.codigo}
    ON CONFLICT (fonte_id, local_codigo, emitido_em) DO UPDATE
    SET coletado_em = NOW(),
        modelo = EXCLUDED.modelo,
        previsao_normalizada = EXCLUDED.previsao_normalizada,
        payload_original = EXCLUDED.payload_original
    RETURNING id
  `;
  return linhas.length;
}

async function obterPrevisaoMaisRecente(localCodigo) {
  if (!bancoConfigurado()) return null;
  const sql = obterBanco();
  const linhas = await sql`
    SELECT previsao_normalizada, coletado_em
    FROM previsoes_meteorologicas
    WHERE local_codigo = ${localCodigo}
    ORDER BY emitido_em DESC, coletado_em DESC
    LIMIT 1
  `;
  if (!linhas[0]) return null;
  return {
    ...linhas[0].previsao_normalizada,
    armazenadoEm: new Date(linhas[0].coletado_em).toISOString(),
  };
}

module.exports = { obterPrevisaoMaisRecente, salvarPrevisao };
