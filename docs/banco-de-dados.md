# Banco de dados hidrometeorológico

Inventário técnico atualizado em: 13/08/2026.

O projeto usa PostgreSQL como armazenamento histórico próprio. A origem de cada
registro permanece identificada: armazenar uma medição da ANA não transforma o
dado em uma medição produzida pelo projeto.

## Estrutura

- `fontes_dados`: ANA, Plugfield e futuras integrações;
- `estacoes_monitoramento`: estações vinculadas a uma fonte;
- `medicoes_hidrologicas`: nível, chuva, vazão, qualidade e horários;
- `medicoes_meteorologicas`: temperatura, sensação térmica, ponto de orvalho,
  Delta T, umidade, vento, rajada, direção do vento, chuva no intervalo, chuva
  diária, pressões absoluta e relativa, luminosidade, índice UV, radiação solar,
  bateria, sinal Wi-Fi, horários e payload original da Plugfield;
- `execucoes_coleta`: auditoria das tentativas de coleta.

A chave única `(estacao_id, medido_em)` torna a importação idempotente.

## Configuração

1. Provisione um PostgreSQL compatível com `DATABASE_URL`.
2. Configure `DATABASE_URL` e `CRON_SECRET` no Vercel, sem adicioná-los ao Git.
3. Instale as dependências com `npm install`.
4. Carregue as variáveis locais e execute `npm run db:migrate` uma vez.
5. Faça o deployment de produção.

O cron executa a coleta da ANA a cada 15 minutos, usando a expressão
`*/15 * * * *`. O projeto da Vercel precisa estar em um plano que aceite essa
frequência de execução.

## Fluxo de leitura e coleta

O endpoint público `/api/ana` consulta somente o banco. Assim, o carregamento do
site não aguarda autenticação, disponibilidade ou resposta da ANA. A resposta
preserva o horário original da medição e informa `origemLeitura: "banco"`.
Medições com mais de 60 minutos, ou com o limite definido em
`LIMITE_DADO_DESATUALIZADO_MINUTOS`, continuam disponíveis, mas recebem o status
`desatualizado`.

A consulta da fonte externa e a persistência em lote ficam isoladas no endpoint
protegido `/api/coleta-ana`, executado pelo cron. Se ainda não houver dado no
banco, ou se o banco estiver indisponível, a leitura pública retorna HTTP 503 sem
tentar a ANA durante a requisição do visitante.

Esse desenho deve ser repetido para novas fontes: cada coletor autentica, consulta,
normaliza e grava; os endpoints consumidos pelo site apenas leem dados normalizados.
O frontend não substitui uma falha dessa leitura por valores simulados locais.

Os horários retornados pela ANA sem informação de fuso são interpretados como
horário de Brasília (`UTC-03:00`) e convertidos para ISO 8601 antes da persistência.
Medições legadas sem fuso explícito permanecem preservadas para auditoria, mas
não participam do cálculo de velocidade, tendência ou projeção.

## Expansão para Plugfield

A integração oficial da Plugfield consulta o dispositivo interno `10595`, código
público `1942`, por meio de `POST /login` e `GET /device/{deviceId}`. O coletor
`/api/coleta-plugfield` normaliza o snapshot meteorológico e grava na tabela
`medicoes_meteorologicas`. O endpoint público `/api/plugfield` consulta somente
o banco.

O coletor normaliza temperatura, sensação térmica, ponto de orvalho, Delta T,
umidade relativa, velocidade e direção do vento, rajada, chuva do intervalo,
chuva do dia, pressão absoluta, pressão relativa, luminosidade, índice UV,
radiação solar, bateria e sinal Wi-Fi. O horário da medição e o payload original
também são armazenados. O payload preserva o identificador, o número de série,
o fuso, o intervalo de atualização e a lista de sensores retornada pelo
dispositivo.

A resposta pública acrescenta a idade e a situação de atualização da medição.
Esses campos são calculados pelo sistema. A integração não recebe nível do rio
da Estação 2.

Em 13/08/2026, a Defesa Civil informou que o medidor da Estação 2 precisa ser
calibrado e, por isso, não estão sendo recebidas novas medições. Durante a
manutenção, registros anteriores devem permanecer históricos e ser marcados
como desatualizados; nenhum valor simulado deve substituir a ausência de dados.

ANA e Plugfield possuem coletas independentes chamadas a cada 15 minutos pelo
GitHub Actions, pois o plano Hobby da Vercel limita CRONs nativos a uma execução
diária. O workflow usa `CRON_SECRET` para acessar os endpoints protegidos. As
credenciais da Plugfield ficam somente nas variáveis de ambiente do backend.

Documentação oficial: https://wdg.plugfield.com.br/doc-api/index.html
