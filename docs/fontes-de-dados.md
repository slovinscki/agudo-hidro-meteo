REGRAS DE DADOS — PLATAFORMA HIDROMETEOROLÓGICA DE AGUDO

Versão inicial: 06/08/2026

OBJETIVO

Este documento define como os dados hidrológicos e meteorológicos devem ser
obtidos, identificados, validados, armazenados, processados e apresentados pela
Plataforma Hidrometeorológica de Agudo.

A plataforma possui caráter informativo. Seus dados, cálculos e classificações
não substituem alertas, boletins ou orientações da Defesa Civil e dos demais
órgãos públicos competentes.

======================================================================

1. FONTES E PROVENIÊNCIA

RD-001 — A plataforma deve priorizar fontes oficiais e consultar, sempre que
possível, a fonte primária responsável pela medição.

RD-002 — Os dados hidrológicos devem ser obtidos prioritariamente da Agência
Nacional de Águas e Saneamento Básico (ANA) e do Serviço Geológico do Brasil
(SGB), por seus sistemas oficiais.

RD-003 — Cada medição deve ser vinculada ao código, nome e localização da
estação que a produziu.

RD-004 — Cada registro deve identificar a instituição responsável pela geração
do dado e o endereço oficial de origem.

RD-005 — A plataforma não deve apresentar como dado oficial uma informação
produzida, estimada ou corrigida pelo próprio sistema.

RD-006 — Dados obtidos por meio de agregadores ou sites de terceiros devem ser
usados somente como fonte auxiliar ou contingencial e nunca devem ocultar a
fonte pública original.

RD-007 — Quando um dado for obtido por uma fonte alternativa, essa condição
deve ser registrada e apresentada ao usuário.

RD-008 — Dados simulados, manuais ou de teste devem ser identificados de forma
visível e não podem ser confundidos com medições reais.

RD-008A — Pontos acompanhados visualmente devem ser apresentados separadamente
das estações automáticas. Uma observação visual deve informar sua descrição,
autor ou fonte e data e hora quando disponíveis, sem atribuir nível em metros,
vazão ou classificação calculada que não tenham sido medidos.

RD-008B — A interface deve identificar explicitamente três naturezas distintas:
observação visual feita por pessoa, medição instrumental obtida por sensor e
dado simulado usado no desenvolvimento.

======================================================================

2. CAMPOS OBRIGATÓRIOS

RD-009 — Toda medição deve possuir, no mínimo:

- identificador da estação;
- nome do ponto de monitoramento;
- variável medida;
- valor original;
- unidade de medida;
- data e hora da medição;
- fuso horário;
- fonte;
- data e hora da coleta pelo sistema;
- status de qualidade e atualização.

RD-010 — O nível do rio deve ser armazenado em metros.

RD-011 — A precipitação deve ser armazenada em milímetros.

RD-012 — A temperatura deve ser armazenada em graus Celsius.

RD-013 — A velocidade do vento deve ser armazenada em quilômetros por hora ou
metros por segundo, com a unidade explicitamente informada.

RD-014 — O sistema deve preservar o valor, a unidade, a data e a hora recebidos
da fonte, mesmo que use valores convertidos ou normalizados na apresentação.

======================================================================

3. DATA, HORA E ATUALIZAÇÃO

RD-015 — A página deve apresentar a hora da medição, e não apenas a hora da
última consulta realizada pelo sistema.

RD-016 — Horários recebidos em UTC devem ser armazenados com essa indicação e
convertidos para o horário local somente na exibição.

RD-017 — O fuso horário padrão de exibição será America/Sao_Paulo.

RD-018 — Cada fonte deve possuir um intervalo esperado de atualização
configurável.

RD-019 — Um dado será considerado desatualizado quando sua idade ultrapassar o
limite definido para a estação ou para a fonte.

RD-020 — O sistema nunca deve apresentar um dado antigo como se fosse uma
leitura atual.

RD-021 — Se uma fonte ficar indisponível, a última medição válida poderá
continuar visível, desde que a data, a hora e o aviso de desatualização sejam
destacados.

RD-022 — Uma nova coleta com horário anterior ao último registro conhecido não
deve substituir silenciosamente a medição mais recente.

======================================================================

4. VALIDAÇÃO E QUALIDADE

RD-023 — Medições sem estação, variável, valor, unidade, data ou hora não devem
ser classificadas como válidas.

RD-024 — Valores ausentes, não numéricos ou fisicamente impossíveis devem ser
rejeitados ou marcados para revisão.

RD-025 — Uma variação muito diferente das leituras anteriores não deve ser
apagada automaticamente; ela deve ser preservada e marcada como possível
inconsistência.

RD-026 — A ausência de dados nunca deve ser interpretada como ausência de
risco.

RD-027 — Dados provisórios devem permanecer identificados como provisórios,
pois a instituição responsável poderá corrigi-los posteriormente.

RD-028 — Correções posteriores devem preservar o valor anterior, o novo valor,
a fonte da correção e a data da alteração.

RD-029 — Dados de fontes diferentes não devem ser combinados como se fossem uma
única medição.

RD-030 — Quando fontes apresentarem valores divergentes, a plataforma deve
mostrar as medições separadamente ou aplicar uma prioridade previamente
documentada.

RD-031 — A plataforma deve adotar os seguintes status básicos:

- atualizado;
- desatualizado;
- indisponível;
- inconsistente;
- provisório;
- corrigido;
- em manutenção.

======================================================================

5. TENDÊNCIA DO NÍVEL

RD-032 — A tendência deve ser calculada somente com medições da mesma estação,
na mesma unidade e provenientes de uma série temporal válida.

RD-033 — A janela inicial para o cálculo da tendência será de seis horas.

RD-034 — A taxa média da tendência será calculada por:

taxa = (nível mais recente - nível inicial da janela) / duração da janela

RD-035 — A taxa deve ser apresentada em centímetros por hora (cm/h).

RD-036 — A classificação inicial será:

- subindo: taxa maior que +0,1 cm/h;
- estável: taxa entre -0,1 cm/h e +0,1 cm/h, inclusive;
- baixando: taxa menor que -0,1 cm/h;
- indisponível: dados insuficientes, antigos ou inconsistentes.

RD-037 — Os limites, a janela e a fórmula devem ser configuráveis e validados
para as características do ponto de monitoramento de Agudo.

RD-038 — A tendência não deve ser calculada quando houver poucos registros,
lacunas excessivas, regressão de horário ou dados inconsistentes.

RD-039 — A indicação “subindo” não deve ser interpretada automaticamente como
perigo. O risco depende também do nível atual, das cotas de referência, da chuva
e das informações oficiais.

RD-040 — A página deve informar a janela usada, o horário da última medição e o
caráter calculado da tendência.

======================================================================

6. COTAS E CLASSIFICAÇÃO HIDROLÓGICA

RD-041 — Cada cota de atenção, alerta ou inundação deve pertencer a uma estação
específica e possuir fonte oficial ou tecnicamente validada.

RD-042 — Uma cota de outra cidade ou estação não pode ser reutilizada em Agudo
sem validação técnica documentada.

RD-043 — Na ausência de cota validada, a plataforma deve exibir somente o nível
medido e não deve classificar a situação como normal, atenção, alerta ou
inundação.

RD-044 — A classificação hidrológica deve resultar de regra determinística,
documentada e auditável.

RD-045 — A plataforma deve diferenciar claramente:

- medição recebida da fonte;
- cálculo realizado pelo sistema;
- estimativa ou projeção;
- alerta ou comunicado oficial.

RD-046 — Cores não devem ser o único recurso de classificação; devem ser
acompanhadas por texto, ícone e descrição acessível.

======================================================================

7. PRECIPITAÇÃO E PREVISÃO METEOROLÓGICA

RD-047 — Toda precipitação acumulada deve informar o período correspondente,
como uma hora, seis horas, 24 horas ou sete dias.

RD-048 — Acumulados de períodos diferentes não devem ser comparados sem
identificação clara.

RD-049 — Chuva observada e chuva prevista devem ser apresentadas separadamente.

RD-050 — Toda previsão deve informar a fonte, o modelo utilizado, a data de
emissão e o período de validade.

RD-051 — A previsão meteorológica não deve ser convertida automaticamente em
alerta de inundação.

RD-052 — Dados brutos do CEMADEN devem ser tratados como sujeitos a
inconsistências e devem passar pelas validações definidas neste documento.

RD-053 — O uso de dados do Open-Meteo deve respeitar os limites do serviço, a
licença vigente e a atribuição exigida pela fonte.

======================================================================

8. HISTÓRICO E AUDITORIA

RD-054 — Novas medições devem ser acrescentadas ao histórico e não devem
sobrescrever registros anteriores.

RD-055 — Cada registro histórico deve preservar valor, unidade, estação, fonte,
data e hora da medição, horário de coleta e status.

RD-056 — Lacunas devem permanecer visíveis em tabelas e gráficos; o sistema não
deve criar valores fictícios para preenchê-las.

RD-057 — Se houver interpolação para finalidade analítica, o resultado deverá
ser armazenado e exibido como estimativa, separado dos dados medidos.

RD-058 — Mudanças de fonte, estação, cota, fórmula ou limite de classificação
devem ser registradas no histórico do projeto.

RD-059 — O sistema deve manter registros de falhas de coleta, rejeições,
correções e mudanças de status para auditoria.

======================================================================

9. DISPONIBILIDADE E CONTINGÊNCIA

RD-060 — Falhas de acesso à fonte não devem apagar a última medição válida.

RD-061 — O sistema deve tentar novamente a coleta sem gerar registros
duplicados.

RD-062 — Uma fonte alternativa somente poderá ser ativada por regra de
contingência documentada.

RD-063 — A troca de fonte deve ficar registrada e visível ao usuário quando
afetar a proveniência ou a comparabilidade dos dados.

RD-064 — Erros internos, credenciais, tokens e detalhes sensíveis não devem ser
exibidos ao público.

======================================================================

10. TRANSPARÊNCIA, LICENÇA E RESPONSABILIDADE

RD-065 — Todo dado apresentado deve incluir atribuição à instituição que o
gerou.

RD-066 — A publicação de dados da Rede Hidrometeorológica Nacional deve indicar
as instituições responsáveis por sua geração.

RD-067 — As condições de licença e atribuição de cada fonte devem ser
documentadas e revisadas antes de sua integração.

RD-068 — O fato de um dado ser público não autoriza copiar código, textos,
logotipos, layout, gráficos ou identidade visual de terceiros.

RD-069 — Regras e cálculos inspirados em outros projetos devem possuir
implementação própria, documentação e validação para a realidade de Agudo.

RD-070 — A página deve declarar que o sistema é informativo e não constitui
canal oficial de emergência.

RD-071 — Estimativas e projeções nunca devem ser usadas como única base para
decisões críticas, evacuação ou resposta a emergências.

RD-072 — Em situações de risco, a plataforma deve direcionar o usuário para a
Defesa Civil e para os boletins oficiais competentes.

======================================================================

REGRA PRINCIPAL

A Plataforma Hidrometeorológica de Agudo nunca deverá transmitir sensação de
segurança baseada em dados ausentes, antigos, provisórios, não validados ou
inconsistentes.

======================================================================

LINKS OFICIAIS DAS FONTES E SERVIÇOS

AGÊNCIA NACIONAL DE ÁGUAS E SANEAMENTO BÁSICO — ANA

Portal oficial:
https://www.gov.br/ana/

Monitoramento e acesso aos sistemas hidrológicos:
https://www.gov.br/ana/pt-br/monitoramento

HidroWeb e Telemetria — acesso oficial aos sistemas:
https://www.gov.br/ana/pt-br/servicos/acesso-a-sistemas/acesso-aos-sistemas

Dados abertos da ANA:
https://www.gov.br/ana/pt-br/acesso-a-informacao/dados-abertos

Manual oficial da API HidroWebservice:
https://www.gov.br/ana/pt-br/assuntos/monitoramento-e-eventos-criticos/monitoramento-hidrologico/orientacoes-manuais/manuais/manual-hidrowebservice_publica.pdf/view

Resolução ANA nº 225/2024 — Rede Hidrometeorológica Nacional:
https://www.gov.br/ana/pt-br/legislacao/resolucoes/resolucoes-regulatorias/2024/225

SERVIÇO GEOLÓGICO DO BRASIL — SGB

Portal oficial:
https://www.sgb.gov.br/

SACE — Sistema de Alerta de Eventos Críticos:
https://sgb.gov.br/sace/

CENTRO NACIONAL DE MONITORAMENTO E ALERTAS DE DESASTRES NATURAIS — CEMADEN

Portal oficial:
https://www.gov.br/cemaden/

Mapa Interativo e dados pluviométricos:
https://www2.cemaden.gov.br/mapainterativo/

INSTITUTO NACIONAL DE METEOROLOGIA — INMET

Portal oficial:
https://portal.inmet.gov.br/

Alertas meteorológicos oficiais:
https://alertas2.inmet.gov.br/

DEFESA CIVIL DO RIO GRANDE DO SUL

Portal oficial:
https://www.defesacivil.rs.gov.br/

OPEN-METEO

Portal e documentação oficial da API:
https://open-meteo.com/
https://open-meteo.com/en/docs

Licença, atribuição e condições de uso:
https://open-meteo.com/en/pricing

OBSERVAÇÃO SOBRE OS LINKS

Os endereços acima apontam para os portais oficiais das instituições ou dos
serviços utilizados. Antes de implementar uma integração, devem ser conferidos
novamente os termos de uso, a licença, os limites de acesso e a documentação
técnica vigente.
