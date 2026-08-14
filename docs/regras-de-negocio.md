REGRAS DE NEGÓCIO — PLATAFORMA HIDROMETEOROLÓGICA DE AGUDO

1. IDENTIFICAÇÃO DOS PONTOS DE MONITORAMENTO

RN-001 — Cada estação ou ponto de monitoramento deve possuir um identificador único.

RN-002 — Cada ponto deve apresentar nome, localização, tipo de medição e instituição responsável.

RN-003 — As cotas de atenção, alerta e inundação devem ser configuradas individualmente para cada ponto de monitoramento.

RN-004 — Nenhuma cota de referência deve ser cadastrada sem uma fonte oficial ou tecnicamente validada.

----------------------------------------------------------------

2. ORIGEM DOS DADOS

RN-005 — Todo dado exibido deve possuir uma fonte identificada.

RN-006 — O sistema deve informar a data e a hora da medição, e não apenas o horário em que a página foi acessada.

RN-007 — Dados provenientes de fontes diferentes não devem ser combinados como se fossem uma única medição.

RN-008 — Quando duas fontes apresentarem valores diferentes, o sistema deve identificar cada fonte separadamente ou utilizar uma regra de prioridade documentada.

RN-009 — Dados simulados utilizados durante o desenvolvimento devem ser claramente identificados como dados de teste.

----------------------------------------------------------------

3. VALIDAÇÃO DAS MEDIÇÕES

RN-010 — O sistema não deve aceitar medições sem data, horário, unidade e ponto de monitoramento.

RN-011 — O nível hidrológico deve ser armazenado e exibido em metros.

RN-012 — A precipitação deve ser armazenada e exibida em milímetros.

RN-013 — A temperatura deve ser armazenada e exibida em graus Celsius.

RN-014 — Valores negativos ou fisicamente impossíveis devem ser rejeitados ou marcados para revisão.

RN-015 — Uma medição muito diferente da anterior não deve ser automaticamente descartada, mas deve ser marcada como possível inconsistência.

RN-016 — O sistema deve preservar o valor original recebido da fonte, mesmo quando houver correção ou normalização para exibição.

----------------------------------------------------------------

4. ATUALIZAÇÃO DOS DADOS

RN-017 — Cada medição deve possuir um status de atualização.

Os status iniciais serão:

- atualizado;
- desatualizado;
- indisponível;
- inconsistente;
- em manutenção.

RN-018 — Um dado será considerado desatualizado quando ultrapassar o intervalo definido para aquela fonte.

RN-019 — O intervalo de atualização deve ser configurável, pois algumas estações podem atualizar em frequências diferentes.

RN-020 — O sistema nunca deve apresentar um dado antigo como se fosse uma leitura atual.

RN-021 — Quando uma fonte estiver indisponível, a última medição poderá continuar visível, desde que seu horário e o aviso de desatualização sejam destacados.

RN-021-A — A área pública de situação atual deve ler medições persistidas no banco de dados e provenientes de fontes confiáveis. Dados simulados ou arquivos locais não podem substituir uma medição instrumental ausente.

RN-021-B — A indisponibilidade temporária da fonte externa não deve apagar a última medição válida armazenada. Se ela ultrapassar o intervalo de atualização configurado, deve permanecer acompanhada do status “desatualizado” e do horário original.

----------------------------------------------------------------

5. CLASSIFICAÇÃO HIDROLÓGICA

RN-022 — A situação de cada ponto será determinada pela comparação entre o nível atual e suas cotas de referência.

Classificações iniciais:

- normal;
- atenção;
- alerta;
- inundação;
- dados indisponíveis.

RN-023 — A classificação deve ser calculada automaticamente a partir das cotas cadastradas.

RN-024 — As cores não devem ser o único recurso utilizado para representar a classificação. O sistema também deve apresentar texto e ícones.

RN-025 — Quando não existir uma cota oficial cadastrada, o sistema deve exibir apenas a medição, sem classificar o local como normal, atenção, alerta ou inundação.

RN-026 — A cota oficial de inundação de Dona Francisca é 7,5 metros e indica o início da inundação do parque da cidade. A referência de 6,2 metros pertence ao Sangrador / Desvio Agudo–Dona Francisca e indica bloqueio total para qualquer tipo de veículo. As duas referências não devem ser tratadas como a mesma cota.

----------------------------------------------------------------

6. PERCENTUAL DA COTA

RN-027 — O percentual da cota será calculado pela relação entre o nível atual e a cota de referência selecionada.

RN-028 — O sistema deve informar claramente qual cota está sendo usada no cálculo.

RN-029 — Um percentual acima de 100% significa que a respectiva cota foi ultrapassada.

RN-030 — O percentual não substitui a apresentação do nível real em metros.

RN-030-A — A barra de percentual usa 7,5 metros como 100%, correspondente à
cota oficial de inundação de Dona Francisca. A cor deve usar, nesta ordem de
prioridade:

- vermelho a partir de 6,2 metros, devido ao bloqueio total do Sangrador;
- amarelo a partir de 90% da cota oficial, quando ainda não houver bloqueio;
- verde abaixo dessas referências;
- cinza quando a medição estiver indisponível.

RN-030-B — O tempo estimado até a cota deve ser exibido somente em horas quando
for inferior a 30 horas. A partir de 30 horas, deve ser exibido em dias e horas.

RN-030-C — A projeção deve calcular e identificar separadamente o tempo para:

- 6,2 metros: bloqueio total do Sangrador para qualquer tipo de veículo;
- 7,5 metros: início da inundação do parque da cidade em Dona Francisca.

Quando uma referência já tiver sido atingida, o sistema deve apresentar o
efeito correspondente em lugar de um tempo restante.

Exemplo:

- nível atual: 6,00 m;
- cota de inundação: 7,50 m;
- percentual da cota: 80%.

----------------------------------------------------------------

7. TENDÊNCIA DO NÍVEL

RN-031 — A tendência deve ser calculada comparando medições do mesmo ponto de monitoramento.

Classificações iniciais:

- subindo;
- estável;
- baixando;
- tendência indisponível.

RN-032 — O sistema deve considerar um intervalo mínimo entre as medições para calcular a tendência.

RN-033 — Pequenas variações dentro de uma margem configurável devem ser consideradas estáveis.

RN-034 — A tendência não deve ser calculada quando as medições estiverem muito distantes no tempo ou quando houver dados inconsistentes.

RN-035 — A indicação “subindo” não deve ser apresentada automaticamente como situação de perigo. O risco depende também do nível atual e das cotas de referência.

----------------------------------------------------------------

8. DADOS METEOROLÓGICOS

RN-036 — A precipitação deve informar o período acumulado, como uma hora, seis horas, 24 horas ou sete dias.

RN-037 — Valores de chuva acumulada de períodos diferentes não devem ser comparados sem identificação clara.

RN-038 — Previsão meteorológica e medição observada devem ser apresentadas separadamente.

RN-039 — A previsão deve indicar sua fonte, data de emissão e período de validade.

RN-040 — O sistema não deve transformar automaticamente uma previsão de chuva em alerta de inundação.

----------------------------------------------------------------

9. SITUAÇÃO GERAL DO MUNICÍPIO

RN-041 — A situação geral de Agudo não deve ser calculada apenas com base em uma única estação quando existirem vários pontos de monitoramento.

RN-042 — Inicialmente, a situação geral poderá representar a classificação mais crítica entre os pontos ativos.

RN-043 — A regra utilizada para definir a situação geral deve ser informada ao usuário.

RN-044 — Pontos com dados indisponíveis não devem ser considerados automaticamente em situação normal.

----------------------------------------------------------------

10. HISTÓRICO

RN-045 — As medições históricas não devem ser sobrescritas quando uma nova medição for recebida.

RN-046 — Cada registro histórico deve preservar fonte, data, horário, valor e ponto de monitoramento.

RN-047 — Correções devem gerar um registro de alteração, preservando o valor anterior.

RN-048 — Gráficos devem informar o período apresentado e a unidade utilizada.

RN-049 — Lacunas de medição devem permanecer visíveis no gráfico, sem criação automática de valores fictícios.

----------------------------------------------------------------

11. ALERTAS E COMUNICAÇÃO PÚBLICA

RN-050 — A plataforma deve informar que possui caráter informativo enquanto não for reconhecida como canal oficial.

RN-051 — O sistema não deve emitir ordens de evacuação ou recomendações de emergência sem validação de uma autoridade competente.

RN-052 — Alertas oficiais devem identificar a instituição emissora, horário de publicação e período de validade.

RN-053 — Mensagens de risco devem usar linguagem simples, direta e sem sensacionalismo.

RN-054 — O sistema deve diferenciar claramente:

- medição automática;
- interpretação calculada pelo sistema;
- previsão meteorológica;
- comunicado oficial.

RN-055 — Em situações de emergência, a página deve direcionar o usuário para os canais oficiais da Defesa Civil e demais órgãos responsáveis.

----------------------------------------------------------------

12. INDISPONIBILIDADE E FALHAS

RN-056 — A ausência de dados nunca deve ser interpretada como ausência de risco.

RN-057 — Quando o sistema não conseguir acessar uma fonte, deverá informar a falha sem apagar a última medição válida.

RN-058 — Erros internos, credenciais ou detalhes técnicos não devem ser apresentados ao público.

RN-059 — O sistema deve registrar falhas de coleta para análise posterior.

----------------------------------------------------------------

13. ADMINISTRAÇÃO DOS DADOS

RN-060 — Apenas usuários autorizados poderão cadastrar ou alterar estações, cotas e fontes.

RN-061 — Alterações em cotas de referência devem registrar autor, data, valor anterior, novo valor e justificativa.

RN-062 — Dados inseridos manualmente devem ser identificados como inserção manual.

RN-063 — O responsável por uma inserção manual deve ser registrado internamente.

RN-064 — Uma medição manual não deve substituir silenciosamente uma medição automática.

----------------------------------------------------------------

14. SEGURANÇA E PRIVACIDADE

RN-065 — Senhas, tokens e chaves de API não devem ser armazenados no código público do GitHub.

RN-066 — Credenciais devem ser armazenadas em variáveis de ambiente.

RN-067 — O sistema deve coletar somente os dados pessoais necessários para sua administração.

RN-068 — Logs públicos não devem apresentar nomes, e-mails, endereços IP ou outras informações pessoais.

----------------------------------------------------------------

15. TRANSPARÊNCIA

RN-069 — A plataforma deve disponibilizar uma página explicando suas fontes, cálculos e limitações.

RN-070 — Toda classificação automática deve possuir uma regra documentada.

RN-071 — Mudanças importantes nas regras de classificação devem ser registradas no histórico do projeto.

RN-072 — O usuário deve conseguir identificar quando um valor é medido, calculado, estimado ou previsto.

----------------------------------------------------------------

REGRA PRINCIPAL

A plataforma nunca deverá transmitir uma sensação de segurança baseada em dados ausentes, antigos, não validados ou inconsistentes.
