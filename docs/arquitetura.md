ARQUITETURA — PLATAFORMA HIDROMETEOROLÓGICA DE AGUDO

Versão inicial: 06/08/2026

======================================================================

1. VISÃO DA ARQUITETURA

A plataforma deve ser simples para quem precisa entender rapidamente a situação
e informativa para quem deseja analisar os dados com maior profundidade.

A organização da informação seguirá o princípio da divulgação progressiva:

- primeiro, mostrar o que é mais importante;
- depois, permitir que o usuário abra detalhes;
- por último, disponibilizar dados técnicos, metodologia e histórico.

A página não deve exigir conhecimento de hidrologia ou meteorologia para ser
compreendida. Ao mesmo tempo, não deve esconder informações necessárias para
auditoria, pesquisa ou análise técnica.

======================================================================

2. PÚBLICOS ATENDIDOS

2.1. Público geral

Inclui moradores, visitantes, famílias e pessoas sem conhecimento técnico.

Esse público precisa saber rapidamente:

- qual é a situação atual;
- qual é o nível do rio;
- se o nível está subindo, estável ou baixando;
- quando o dado foi medido;
- se o dado está atualizado;
- onde encontrar orientações oficiais.

2.2. Público interessado

Inclui agricultores, estudantes, jornalistas, voluntários e moradores que
acompanham o rio com frequência.

Esse público pode querer consultar:

- diferença para as cotas de referência;
- chuva acumulada;
- histórico de horas ou dias;
- comparação entre estações;
- velocidade de subida ou descida;
- origem dos dados.

2.3. Público técnico

Inclui Defesa Civil, pesquisadores, professores, profissionais de tecnologia,
hidrologia, meteorologia e gestão pública.

Esse público pode querer acessar:

- código e metadados da estação;
- valores brutos;
- unidade e fuso horário;
- fórmula e janela dos cálculos;
- status de qualidade;
- registros inconsistentes ou ausentes;
- arquivos JSON ou CSV;
- metodologia e limitações.

======================================================================

3. PRINCÍPIO DAS TRÊS CAMADAS DE INFORMAÇÃO

CAMADA 1 — RESPOSTA IMEDIATA

Deve estar visível sem cliques e sem rolagem excessiva.

Conteúdo:

- situação atual em texto;
- nível mais recente do rio;
- tendência;
- horário da medição;
- status de atualização;
- aviso de caráter informativo;
- acesso aos canais oficiais.

Exemplo:

Situação atual: ATENÇÃO
Rio subindo lentamente
Nível: 6,20 m
Última medição: 10h45
Dados atualizados

CAMADA 2 — ENTENDA A SITUAÇÃO

Deve aparecer em cartões simples logo abaixo do resumo.

Conteúdo:

- distância para a cota de atenção ou inundação;
- chuva observada nas últimas 24 horas;
- previsão resumida;
- gráfico simplificado;
- explicação curta do significado da classificação.

CAMADA 3 — VER MAIS DETALHES

Deve ficar em caixas expansíveis, abas ou páginas secundárias.

Conteúdo:

- histórico completo;
- tabela de medições;
- fonte e código da estação;
- fórmula da tendência;
- cotas cadastradas e suas fontes;
- qualidade e disponibilidade dos dados;
- metodologia;
- downloads;
- limitações do sistema.

======================================================================

4. ESTRUTURA DA PÁGINA PRINCIPAL

4.1. Cabeçalho

Deve conter:

- nome da plataforma;
- identificação de Agudo, RS;
- navegação principal;
- botão ou link para canais oficiais;
- opção de acessibilidade, quando aplicável.

4.2. Faixa de situação atual

É o elemento de maior destaque da página.

Deve apresentar:

- classificação escrita por extenso;
- mensagem curta em linguagem comum;
- horário da última medição;
- indicação clara quando o dado estiver desatualizado ou indisponível.

A cor deve reforçar a informação, mas nunca ser o único meio de comunicá-la.

4.3. Cartão do nível do rio

Deve apresentar:

- nível atual em metros;
- tendência em texto e ícone;
- taxa em cm/h dentro da área de detalhes;
- diferença para a cota de referência;
- nome do rio e da estação.

Caixa expansível “Como interpretar”:

- explicação do que significa nível do rio;
- explicação da tendência;
- aviso de que “subindo” não significa necessariamente inundação.

Caixa expansível “Dados técnicos”:

- código da estação;
- fonte;
- data e hora completas;
- janela e fórmula do cálculo;
- status de qualidade.

4.4. Cartão de chuva

Deve apresentar:

- chuva observada nas últimas 24 horas;
- período do acumulado;
- previsão resumida claramente separada da observação.

Caixa expansível “Ver períodos”:

- uma hora;
- seis horas;
- 24 horas;
- sete dias, quando disponível.

Caixa expansível “Fonte e modelo”:

- estação ou serviço utilizado;
- modelo meteorológico;
- emissão da previsão;
- validade;
- limitações.

4.5. Gráfico histórico

O gráfico inicial deve ser simples, com o nível do rio ao longo das últimas
24 horas.

Deve conter:

- título claro;
- unidade;
- período;
- linha do nível;
- linhas das cotas somente quando validadas;
- lacunas reais quando não houver medição;
- alternativa em tabela para acessibilidade.

Controles adicionais:

- 24 horas;
- sete dias;
- 30 dias;
- 90 dias, quando disponível.

4.6. Avisos oficiais

Deve haver uma área própria para comunicados oficiais.

Essa área deve diferenciar visualmente:

- comunicado oficial;
- medição automática;
- interpretação calculada pela plataforma;
- previsão meteorológica.

Se não houver integração oficial, a página deve apenas fornecer links para os
canais competentes e não deve afirmar que “não existem alertas”.

4.7. Fontes e atualização

Ao final da página, deve aparecer um resumo curto:

- fonte hidrológica;
- fonte meteorológica;
- última coleta realizada;
- limitações;
- link para metodologia completa.

======================================================================

5. NAVEGAÇÃO PRINCIPAL

A primeira versão deve ter poucas opções:

- Seja um colaborador;
- Defesa Civil — canais oficiais.

Em telas pequenas, as duas opções devem permanecer fáceis de encontrar.

======================================================================

6. COMPONENTES REUTILIZÁVEIS

A interface deve ser construída com componentes visuais reutilizáveis:

- faixa de situação;
- cartão de indicador;
- selo de atualização;
- selo de fonte;
- caixa expansível;
- aviso informativo;
- aviso oficial;
- gráfico temporal;
- tabela de medições;
- estado de carregamento;
- estado sem dados;
- estado de erro;
- rodapé de fontes.

Todos os cartões devem seguir o mesmo padrão:

1. nome do indicador;
2. valor principal;
3. explicação curta;
4. horário da medição;
5. status;
6. botão “Ver detalhes”.

======================================================================

7. LINGUAGEM E APRESENTAÇÃO

7.1. Linguagem principal

O texto visível deve usar palavras comuns e frases curtas.

Preferir:

- “O rio está subindo”;
- “Última medição há 20 minutos”;
- “Faltam 1,30 m para a cota de inundação”.

Evitar na camada principal:

- “derivada temporal positiva”;
- “série fluviométrica ascendente”;
- siglas sem explicação.

7.2. Linguagem técnica

Termos técnicos podem aparecer nas caixas de detalhes, desde que acompanhados
por explicação ou acesso ao glossário.

7.3. Números

- usar vírgula como separador decimal na interface em português;
- mostrar sempre a unidade;
- evitar precisão maior do que a fornecida pela estação;
- apresentar data e hora completas nos detalhes;
- informar claramente o período de valores acumulados.

======================================================================

8. ACESSIBILIDADE

A arquitetura deve considerar desde o início:

- funcionamento em celular, computador e conexão lenta;
- contraste adequado;
- navegação por teclado;
- textos alternativos para imagens;
- nomes acessíveis para botões e ícones;
- gráficos acompanhados de tabela ou resumo textual;
- estado indicado por texto, e não apenas por cor;
- caixas expansíveis que funcionem com leitores de tela;
- tamanho de fonte legível;
- ausência de animações indispensáveis para compreender os dados.

A informação essencial deve continuar acessível mesmo se gráficos, mapas ou
scripts não carregarem.

======================================================================

9. ARQUITETURA TÉCNICA DO MVP

A primeira versão deve evitar complexidade desnecessária.

Tecnologias:

- HTML semântico;
- CSS responsivo;
- JavaScript puro;
- arquivos JSON para dados estruturados;
- Git e GitHub para versionamento;
- GitHub Pages para publicação.

Fluxo inicial:

FONTE DE DADOS
      |
      v
COLETA OU ARQUIVO JSON
      |
      v
VALIDAÇÃO DOS DADOS
      |
      v
CÁLCULOS DA PLATAFORMA
      |
      v
INTERFACE PÚBLICA

Para o primeiro protótipo, os dados podem ser simulados ou atualizados
manualmente, desde que sejam identificados claramente como dados de teste.

======================================================================

10. ESTRUTURA INICIAL DO REPOSITÓRIO

agudo-hidro-meteo/
|
+-- index.html
+-- css/
|   +-- estilos.css
+-- js/
|   +-- app.js
|   +-- dados.js
|   +-- interface.js
+-- data/
|   +-- estacoes.json
|   +-- medicoes.json
|   +-- configuracao.json
+-- assets/
|   +-- icons/
|   +-- images/
+-- docs/
|   +-- arquitetura.txt
|   +-- regras-de-negocio.txt
|   +-- regras-de-dados.txt
|   +-- fontes-de-dados.txt
|   +-- glossario.txt
+-- tests/
+-- README.md
+-- .gitignore

Responsabilidades:

- index.html: estrutura semântica da página;
- estilos.css: apresentação e responsividade;
- app.js: inicialização da aplicação;
- dados.js: leitura e validação dos dados;
- interface.js: atualização dos componentes visuais;
- estacoes.json: identificação e metadados das estações;
- medicoes.json: valores usados no protótipo;
- configuracao.json: cotas, intervalos e limites configuráveis;
- docs: decisões, regras, fontes e limitações do projeto.

======================================================================

11. MODELO CONCEITUAL DOS DADOS

ESTAÇÃO

- identificador;
- código oficial;
- nome;
- rio;
- município;
- latitude e longitude;
- instituição responsável;
- cotas validadas;
- intervalo esperado de atualização.

MEDIÇÃO

- identificador;
- estação;
- variável;
- valor;
- unidade;
- data e hora da medição;
- data e hora da coleta;
- fonte;
- status de qualidade.

CLASSIFICAÇÃO

- estação;
- situação calculada;
- tendência;
- taxa em cm/h;
- cota utilizada;
- regra aplicada;
- data e hora do cálculo.

COMUNICADO OFICIAL

- instituição emissora;
- título;
- conteúdo;
- data e hora de publicação;
- período de validade;
- endereço oficial.

======================================================================

12. ESTADOS OBRIGATÓRIOS DA INTERFACE

A página deve ser projetada para todos estes estados:

- dados atualizados e situação normal;
- dados atualizados e situação elevada;
- rio subindo rapidamente;
- dados desatualizados;
- fonte indisponível;
- medição inconsistente;
- estação em manutenção;
- cota ainda não validada;
- previsão meteorológica indisponível;
- carregamento inicial;
- falha parcial, quando apenas alguns indicadores estão disponíveis.

Em nenhum desses estados a página deve ficar vazia ou transmitir uma conclusão
incorreta.

======================================================================

13. EVOLUÇÃO FUTURA

FASE 1 — PÁGINA ESTÁTICA

- estrutura visual;
- dados de teste identificados;
- cartões;
- caixas expansíveis;
- gráfico simples;
- documentação.

FASE 2 — DADOS REAIS

- integração com fontes oficiais;
- validação automática;
- atualização programada;
- histórico básico;
- identificação de indisponibilidade.

FASE 3 — SERVIÇO DE DADOS

- banco de dados;
- API própria;
- múltiplas estações;
- auditoria;
- painel administrativo;
- exportação JSON e CSV.

FASE 4 — RECURSOS AVANÇADOS

- mapas;
- comparação entre estações;
- notificações;
- integração de comunicados oficiais;
- modelos de previsão validados;
- colaboração institucional.

Cada fase só deve ser iniciada quando a anterior estiver confiável e
documentada.

======================================================================

14. DECISÕES PRINCIPAIS

ARQ-001 — A primeira tela será destinada ao público geral.

ARQ-002 — Informações técnicas serão oferecidas por caixas expansíveis e
páginas de detalhes.

ARQ-003 — A informação essencial deverá ser compreendida em aproximadamente
dez segundos.

ARQ-004 — A página deverá funcionar prioritariamente em celulares.

ARQ-005 — O MVP utilizará tecnologias web simples e poderá ser publicado no
GitHub Pages.

ARQ-006 — Dados, cálculos e interface permanecerão separados para facilitar
testes e manutenção.

ARQ-007 — A plataforma deverá continuar informativa quando parte dos dados
estiver indisponível.

ARQ-008 — Nenhuma estimativa será apresentada como medição ou alerta oficial.

======================================================================

PRINCÍPIO CENTRAL

O visitante deve compreender rapidamente a situação atual sem precisar abrir
detalhes. Quem desejar verificar fontes, fórmulas, histórico e qualidade dos
dados deve encontrar essas informações com poucos cliques, sem que elas
atrapalhem a leitura principal.
