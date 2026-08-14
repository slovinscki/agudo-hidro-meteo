CREATE TABLE IF NOT EXISTS medicoes_meteorologicas (
  id BIGSERIAL PRIMARY KEY,
  estacao_id BIGINT NOT NULL REFERENCES estacoes_monitoramento(id),
  medido_em TIMESTAMPTZ NOT NULL,
  coletado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  temperatura_c NUMERIC(7, 2),
  sensacao_termica_c NUMERIC(7, 2),
  ponto_orvalho_c NUMERIC(7, 2),
  delta_t_c NUMERIC(7, 2),
  umidade_percentual NUMERIC(7, 2),
  vento_kmh NUMERIC(8, 2),
  rajada_kmh NUMERIC(8, 2),
  direcao_vento_graus NUMERIC(7, 2),
  chuva_intervalo_mm NUMERIC(10, 2),
  chuva_dia_mm NUMERIC(10, 2),
  pressao_absoluta_hpa NUMERIC(9, 2),
  pressao_relativa_hpa NUMERIC(9, 2),
  luminosidade_lux NUMERIC(12, 2),
  indice_uv NUMERIC(7, 2),
  radiacao_solar_wm2 NUMERIC(10, 2),
  bateria_percentual NUMERIC(7, 2),
  sinal_wifi_percentual NUMERIC(7, 2),
  payload_original JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (estacao_id, medido_em)
);

CREATE INDEX IF NOT EXISTS idx_medicoes_meteorologicas_estacao_data
  ON medicoes_meteorologicas (estacao_id, medido_em DESC);

INSERT INTO fontes_dados (codigo, nome, url_oficial)
VALUES ('PLUGFIELD', 'Plugfield', 'https://plugfield.com.br/')
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome, url_oficial = EXCLUDED.url_oficial;

INSERT INTO estacoes_monitoramento (
  fonte_id, codigo_externo, nome, municipio, uf, latitude, longitude, metadados
)
SELECT
  id,
  '1942',
  'Porto Agudo/Jacuí',
  'Agudo',
  'RS',
  -29.62452,
  -53.29138,
  '{"idPlataforma":"10595","modelo":"WS22","fuso":"GMT-3"}'::jsonb
FROM fontes_dados
WHERE codigo = 'PLUGFIELD'
ON CONFLICT (fonte_id, codigo_externo) DO UPDATE
SET nome = EXCLUDED.nome,
    municipio = EXCLUDED.municipio,
    uf = EXCLUDED.uf,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    metadados = EXCLUDED.metadados,
    atualizado_em = NOW();
