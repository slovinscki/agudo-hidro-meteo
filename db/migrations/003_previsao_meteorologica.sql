CREATE TABLE IF NOT EXISTS previsoes_meteorologicas (
  id BIGSERIAL PRIMARY KEY,
  fonte_id BIGINT NOT NULL REFERENCES fontes_dados(id),
  local_codigo TEXT NOT NULL,
  emitido_em TIMESTAMPTZ NOT NULL,
  inicio_em TIMESTAMPTZ NOT NULL,
  fim_em TIMESTAMPTZ NOT NULL,
  coletado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modelo TEXT,
  previsao_normalizada JSONB NOT NULL,
  payload_original JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fonte_id, local_codigo, emitido_em)
);

CREATE INDEX IF NOT EXISTS idx_previsoes_local_data
  ON previsoes_meteorologicas (local_codigo, emitido_em DESC);

INSERT INTO fontes_dados (codigo, nome, url_oficial)
VALUES
  ('OPEN_METEO', 'Open-Meteo', 'https://open-meteo.com/'),
  ('MET_NORWAY', 'MET Norway', 'https://api.met.no/')
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome, url_oficial = EXCLUDED.url_oficial;
