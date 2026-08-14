REGRAS DE DADOS — PLATAFORMA HIDROMETEOROLÓGICA DE AGUDO

Versão inicial: 06/08/2026
Inventário de dados atualizado em: 13/08/2026

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

----------------------------------------------------------------------

1.1. INVENTÁRIO DAS INTEGRAÇÕES EM OPERAÇÃO

Data de referência deste inventário: 13/08/2026.

Esta data representa o momento em que a disponibilidade descrita abaixo foi
registrada na documentação. Alterações futuras nas fontes, estações, sensores,
campos ou cálculos devem gerar uma nova entrada no histórico da seção 1.2, sem
apagar os registros anteriores.

ANA — ESTAÇÃO 1, DONA FRANCISCA

A integração consulta a estação hidrológica Dona Francisca, código 85400000,
por meio do HidroWebService da ANA. O sistema recebe e preserva:

- nível do rio (cota adotada), originalmente em centímetros e normalizado para
  metros;
- precipitação observada, em milímetros;
- vazão, em metros cúbicos por segundo (m³/s);
- data e hora da medição;
- data e hora de atualização informada pela ANA;
- qualidade do nível;
- qualidade da precipitação;
- qualidade da vazão;
- código, nome e fonte da estação.

A partir da série histórica válida da própria estação, o sistema calcula:

- taxa de variação do nível, em centímetros por hora;
- tendência do nível: subindo, estável ou baixando;
- janela temporal usada no cálculo;
- data e hora da medição de referência da variação.

O sistema também acrescenta metadados de operação para informar a origem da
leitura, a idade da medição e sua situação de atualização. Tendência, taxa de
variação, idade e situação de atualização são informações calculadas pelo
sistema e não medições fornecidas diretamente pela ANA.

DFESA — UHE DONA FRANCISCA

A integração consulta a página pública de Hidrologia da DFESA. Não foi
identificada uma API pública documentada: as séries horárias são extraídas do
objeto estruturado `chart_vars`, incorporado ao HTML da página. Por isso, a
integração deve ser monitorada e pode precisar de manutenção caso a estrutura
da página seja alterada.

O sistema recebe e preserva:

- nível do reservatório, em metros;
- afluência, em metros cúbicos por segundo (m³/s);
- vazão turbinada e vazão vertida, em m³/s;
- defluência total, em m³/s;
- nível de jusante, em metros;
- chuva e percentual de volume útil publicados pela fonte;
- data e hora de cada medição;
- histórico horário disponível na página.

Afluência é a água que chega ao reservatório. Defluência é a água que sai da
usina pelas turbinas, vertedouro e demais descargas. A diferença `afluência −
defluência` é usada somente como indicador simplificado da tendência de
armazenamento: positiva sugere aumento, negativa sugere redução e valores
próximos de zero sugerem estabilidade. Ela não substitui o balanço hídrico
oficial, que pode incluir chuva direta, evaporação, contribuições laterais e
outras perdas ou retiradas.

Para o rio a jusante, a defluência é a variável da usina com efeito direto mais
imediato. O nível observado em Agudo também depende do tempo de propagação,
geometria da calha, afluentes locais, chuva, remanso e condições anteriores do
rio; portanto, não existe conversão universal de m³/s para metros.

O Boletim Rio Jacuí da Defesa Civil de Agudo, de 14/08/2026 às 07:00, informa
as referências de vazão de 3.000 m³/s para atenção e 3.500 m³/s para inundação.
O sistema as aplica provisoriamente à defluência para avaliar o trecho a
jusante. Esses valores são limites operacionais de vazão, não cotas da régua,
níveis do reservatório ou limites estruturais da barragem. A associação com a
defluência deve ser confirmada formalmente com a Defesa Civil ou a DFESA.

PLUGFIELD — ESTAÇÃO 2, PORTO AGUDO/JACUÍ

A integração consulta o dispositivo interno 10595, código externo 1942, da
estação meteorológica de Porto Agudo/Jacuí. O snapshot recebido pode conter:

- temperatura do ar, em graus Celsius;
- sensação térmica, em graus Celsius;
- ponto de orvalho, em graus Celsius;
- Delta T, em graus Celsius;
- umidade relativa, em percentual;
- velocidade do vento, em quilômetros por hora;
- velocidade das rajadas, em quilômetros por hora;
- direção do vento, em graus;
- chuva acumulada no intervalo da leitura, em milímetros;
- chuva acumulada no dia, em milímetros;
- pressão atmosférica absoluta, em hectopascais;
- pressão atmosférica relativa, em hectopascais;
- luminosidade, em lux;
- índice ultravioleta (UV);
- radiação solar, em watts por metro quadrado;
- nível da bateria, em percentual;
- qualidade do sinal Wi-Fi, em percentual;
- data e hora da medição;
- identificador e número de série do dispositivo;
- fuso horário e intervalo de atualização configurados no equipamento;
- lista original de sensores e valores, preservada para auditoria.

O sistema acrescenta a idade da medição e a situação de atualização. Esses dois
campos são calculados localmente e não são sensores da Plugfield. Bateria e
sinal Wi-Fi são dados operacionais usados para diagnosticar alimentação,
conectividade e possíveis interrupções de coleta.

A integração Plugfield da Estação 2 não fornece nível do rio. Nenhum valor de
nível simulado ou cadastrado para desenvolvimento pode ser apresentado como
medição instrumental dessa estação.

SITUAÇÃO OPERACIONAL DA ESTAÇÃO 2

Em 13/08/2026, a Defesa Civil informou que o medidor da Estação 2 precisa ser
calibrado e que, por esse motivo, a estação não está enviando novas medições.
Enquanto durar a calibração:

- a estação deve ser identificada como “em manutenção — medidor em calibração”;
- a ausência de novas leituras não deve ser interpretada como ausência de
  chuva, vento forte ou risco;
- a última medição válida pode permanecer no histórico, sempre acompanhada de
  sua data, hora e aviso de desatualização;
- valores simulados não devem substituir as medições ausentes;
- a retomada da publicação de dados atuais depende da conclusão da calibração e
  da validação das novas leituras.

----------------------------------------------------------------------

1.2. HISTÓRICO DE DISPONIBILIDADE DAS INFORMAÇÕES

Cada mudança deve registrar a data, a fonte ou estação afetada, os dados
adicionados, removidos ou temporariamente indisponíveis, a classificação da
mudança e sua origem. Para este histórico:

- upgrade: inclusão de uma nova variável, fonte, estação, metadado ou melhoria
  de qualidade, frequência ou confiabilidade;
- downgrade: remoção de uma variável ou redução de qualidade, frequência,
  confiabilidade ou cobertura;
- indisponibilidade temporária: interrupção que não representa remoção
  definitiva da integração;
- restabelecimento: retomada de uma informação anteriormente indisponível.

### 13/08/2026 — Criação do inventário de dados disponíveis

- Classificação: registro inicial.
- ANA — Estação 1: documentados nível do rio, precipitação, vazão, horários,
  indicadores de qualidade e os cálculos derivados de variação e tendência.
- Plugfield — Estação 2: documentados os dados meteorológicos, ambientais,
  operacionais e metadados do dispositivo descritos na seção 1.1.
- Origem da informação: integrações e estruturas de persistência implementadas
  no projeto.

### 13/08/2026 — Interrupção das medições da Estação 2

- Classificação: indisponibilidade temporária, não downgrade definitivo.
- Dados afetados: todas as novas medições fornecidas pelo dispositivo
  Plugfield da Estação 2.
- Motivo: medidor precisa ser calibrado.
- Origem da informação: Defesa Civil.
- Situação: em manutenção, aguardando calibração e validação das novas leituras.
- Dados históricos: preservados, com data, hora e indicação de desatualização.

### 14/08/2026 — Integração da hidrologia da UHE Dona Francisca

- Classificação: upgrade.
- Fonte: página pública de Hidrologia da DFESA.
- Dados adicionados: reservatório, jusante, afluência, vazões turbinada e
  vertida, defluência, chuva, volume útil e histórico horário.
- Cálculo derivado: balanço simplificado `afluência − defluência`.
- Referências operacionais provisórias: atenção em 3.000 m³/s e inundação em
  3.500 m³/s, conforme Boletim Rio Jacuí da Defesa Civil de Agudo.
- Limitação: a fonte não oferece API pública documentada; os dados estruturados
  são incorporados ao HTML da página.

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
https://avisos.inmet.gov.br/

Integração de avisos ativos (JSON, sem autenticação):
https://apiprevmet3.inmet.gov.br/avisos/ativos

A aplicação consulta os avisos no backend, identifica Agudo pelo código IBGE
4300109 e publica somente os avisos em cuja lista de municípios esse código
aparece. A consulta usa cache de cinco minutos e não transforma previsão ou
medição local em alerta oficial.

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
