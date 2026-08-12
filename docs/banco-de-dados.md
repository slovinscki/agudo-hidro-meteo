# Banco de dados hidrometeorológico

O projeto usa PostgreSQL como armazenamento histórico próprio. A origem de cada
registro permanece identificada: armazenar uma medição da ANA não transforma o
dado em uma medição produzida pelo projeto.

## Estrutura

- `fontes_dados`: ANA, Plugfield e futuras integrações;
- `estacoes_monitoramento`: estações vinculadas a uma fonte;
- `medicoes_hidrologicas`: nível, chuva, vazão, qualidade e horários;
- `execucoes_coleta`: auditoria das tentativas de coleta.

A chave única `(estacao_id, medido_em)` torna a importação idempotente.

## Configuração

1. Provisione um PostgreSQL compatível com `DATABASE_URL`.
2. Configure `DATABASE_URL` e `CRON_SECRET` no Vercel, sem adicioná-los ao Git.
3. Instale as dependências com `npm install`.
4. Carregue as variáveis locais e execute `npm run db:migrate` uma vez.
5. Faça o deployment de produção.

O cron padrão executa diariamente às 09:00 UTC, compatível com o plano Hobby do
Vercel. Em um plano que aceite maior frequência, altere o agendamento para
`*/15 * * * *`.

## Comportamento de fallback

O endpoint público `/api/ana` consulta a ANA sem depender da disponibilidade do
banco. A persistência em lote é responsabilidade de `/api/coleta-ana`, chamado
pelo cron protegido. Se a fonte estiver indisponível, `/api/ana` tenta retornar
a última medição armazenada com:

- fonte `ANA — última medição armazenada`;
- `persistencia.fallback = true`;
- horário original da medição preservado.

Se nem a ANA nem o banco estiverem disponíveis, o endpoint retorna HTTP 502.

## Expansão para Plugfield

Uma futura integração deverá cadastrar a fonte e suas estações, normalizar as
unidades e gravar nas mesmas tabelas. Credenciais específicas da Plugfield ficam
somente nas variáveis de ambiente.
