CREATE TABLE IF NOT EXISTS fontes_dados (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  url_oficial TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estacoes_monitoramento (
  id BIGSERIAL PRIMARY KEY,
  fonte_id BIGINT NOT NULL REFERENCES fontes_dados(id),
  codigo_externo TEXT NOT NULL,
  nome TEXT NOT NULL,
  municipio TEXT,
  uf CHAR(2),
  rio TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  metadados JSONB NOT NULL DEFAULT '{}'::jsonb,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fonte_id, codigo_externo)
);

CREATE TABLE IF NOT EXISTS medicoes_hidrologicas (
  id BIGSERIAL PRIMARY KEY,
  estacao_id BIGINT NOT NULL REFERENCES estacoes_monitoramento(id),
  medido_em TIMESTAMPTZ NOT NULL,
  coletado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nivel_metros NUMERIC(10, 3),
  chuva_mm NUMERIC(10, 2),
  vazao_m3s NUMERIC(14, 3),
  qualidade_nivel TEXT,
  qualidade_chuva TEXT,
  qualidade_vazao TEXT,
  payload_original JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (estacao_id, medido_em)
);

CREATE INDEX IF NOT EXISTS idx_medicoes_estacao_data
  ON medicoes_hidrologicas (estacao_id, medido_em DESC);

CREATE TABLE IF NOT EXISTS execucoes_coleta (
  id BIGSERIAL PRIMARY KEY,
  fonte_id BIGINT REFERENCES fontes_dados(id),
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalizado_em TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('executando', 'sucesso', 'parcial', 'erro')),
  quantidade_recebida INTEGER NOT NULL DEFAULT 0,
  quantidade_inserida INTEGER NOT NULL DEFAULT 0,
  mensagem_erro TEXT,
  metadados JSONB NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO fontes_dados (codigo, nome, url_oficial)
VALUES ('ANA', 'Agência Nacional de Águas e Saneamento Básico', 'https://www.gov.br/ana/')
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome, url_oficial = EXCLUDED.url_oficial;

INSERT INTO estacoes_monitoramento (
  fonte_id,
  codigo_externo,
  nome,
  municipio,
  uf,
  rio
)
SELECT id, '85400000', 'Dona Francisca', 'Dona Francisca', 'RS', 'Rio Jacuí'
FROM fontes_dados
WHERE codigo = 'ANA'
ON CONFLICT (fonte_id, codigo_externo) DO UPDATE
SET nome = EXCLUDED.nome,
    municipio = EXCLUDED.municipio,
    uf = EXCLUDED.uf,
    rio = EXCLUDED.rio,
    atualizado_em = NOW();
