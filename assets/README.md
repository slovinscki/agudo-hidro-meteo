Objetivo inicial
Criar uma plataforma responsiva que apresente, de forma simples e confiável:
nível atual dos rios e arroios monitorados;
percentual em relação às cotas de atenção, alerta e inundação;
chuva acumulada;
temperatura e condições meteorológicas;
horário da última atualização;
origem de cada informação;
avisos claros quando os dados estiverem desatualizados ou indisponíveis.
A plataforma deve ser inicialmente informativa, sem se apresentar como sistema oficial de emergência enquanto não houver integração ou validação com órgãos responsáveis.
Primeira versão — MVP
A primeira página não precisa ter banco de dados nem atualização automática. Podemos começar utilizando dados simulados ou preenchidos manualmente.
Ela deverá conter:
Cabeçalho
Nome do projeto.
Município de Agudo.
Horário da última atualização.

Resumo da situação

## Situação geral: normal, atenção, alerta ou inundação. (sempre usar esse tipo de dado para facilitar a visualização)
Mensagem curta para a população.

Nível hidrológico
Nível atual em metros.
Cota de inundação.
Percentual atingido.
Tendência: subindo, estável ou baixando.

Dados meteorológicos
Temperatura.
Chuva acumulada.
Previsão resumida.
Possibilidade de chuva intensa.

Gráfico histórico
Evolução do nível nas últimas horas ou dias.
Inicialmente poderá usar dados fictícios em JavaScript.

Fontes e responsabilidade
Origem dos dados.
Horário da coleta.
Aviso de que emergências devem ser acompanhadas pelos canais oficiais.

Estratégia técnica
Para a primeira versão:
HTML semântico;
CSS responsivo;
JavaScript puro;
dados armazenados provisoriamente em um arquivo JSON;
Git e GitHub desde o primeiro dia;
publicação gratuita pelo GitHub Pages.
Posteriormente, poderemos evoluir para:
integração com APIs meteorológicas;
coleta automática de estações;
PostgreSQL ou Supabase;
histórico de medições;
painel administrativo;
mapas;
notificações;
sistema de alertas;
colaboração com Defesa Civil, prefeitura ou universidades.
Regras essenciais do projeto
Todo dado exibido deverá mostrar:
unidade de medida;
fonte;
data e hora da leitura;
status de atualização;
diferença para a cota de referência.
Também precisaremos planejar situações como:
estação fora do ar;
dado antigo;
valor incorreto ou impossível;
falha de conexão;
fontes divergentes;
alteração da cota de referência.
Uma página hidrológica precisa ser confiável até quando não possui dados.
Antes de convidar os colegas
O repositório deverá ter uma base organizada:
README explicando o problema;
primeira página publicada;
lista de funcionalidades planejadas;
issues separadas por tarefa;
instruções para executar o projeto;
padrões básicos de código;
fontes de dados documentadas;
divisão entre funcionalidades concluídas, em desenvolvimento e futuras.
Assim, os colegas não receberão apenas uma ideia: receberão um projeto funcional no qual poderão contribuir.


## Roadmap inicial ##

# Fase 1 — Produto: definir usuários, dados, indicadores e limites do sistema.

# Fase 2 — Interface: criar wireframe e página estática.

# Fase 3 — Protótipo: adicionar dados simulados e gráficos.

# Fase 4 — Dados reais: pesquisar fontes, APIs e formas de coleta.

# Fase 5 — Persistência: implementar banco de dados e histórico.

# Fase 6 — Colaboração: preparar o repositório e convidar colegas.

# Fase 7 — Validação: apresentar o projeto para pessoas ligadas à meteorologia, hidrologia e Defesa Civil.

Nosso primeiro marco será:
Publicar uma página responsiva que permita entender a situação hidrológica de Agudo em menos de dez segundos.

A próxima etapa será construir o Documento Zero do projeto, definindo problema, público, escopo do MVP e informações que aparecerão na primeira tela.


## Participação e governança 10-08-2026

O projeto possui participação aberta e permissões progressivas,
de acordo com as responsabilidades assumidas por cada participante.

Consulte [Governança do projeto](docs/governanca.md).