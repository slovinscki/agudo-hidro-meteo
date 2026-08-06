Proposta da tela inicial

# 1. Cabeçalho compacto

“Plataforma Hidrometeorológica de Agudo”
Identificação: “Agudo, RS”
Link destacado: “Canais oficiais”
Menu: Início, Histórico, Estações, Metodologia e Sobre
No celular, manter visíveis o nome da plataforma e o acesso aos canais oficiais; os demais itens ficam no menu.

# 2. Faixa de situação atual

É o primeiro e mais destacado bloco:
Situação atual: cota de referência ainda não validada
Nível do rio medido em 6,20 m
O rio está subindo lentamente
Medição realizada hoje, às 10h45 — há 20 minutos

A faixa deve incluir:

classificação escrita, nunca comunicada apenas por cor;
tendência identificada como “calculada pela plataforma”;
selo “Atualizado”, “Desatualizado”, “Provisório” ou equivalente;
aviso claro se a fonte estiver indisponível;
indicação visível de “Dados de teste” durante o protótipo.
Enquanto não houver cotas validadas, não mostrar “Normal”, “Atenção”, “Alerta” ou “Inundação”.

# 3. Orientação oficial

Logo após a situação:
Esta plataforma é informativa e não constitui um canal oficial de emergência.

# Botões:

“Consultar Defesa Civil do RS”
“Ver alertas meteorológicos oficiais”
A interface não deve afirmar que “não há alertas” enquanto não existir uma integração oficial capaz de sustentar essa conclusão.

# 4. Dois cartões principais

Nível do rio
valor atual em metros;
nome do rio e da estação;
tendência em texto e ícone;
horário da medição;
status de atualização.
Caixas expansíveis:
Como interpretar: explica nível e tendência em linguagem comum;
Dados técnicos: código da estação, fonte, horário completo, fuso, qualidade, taxa em cm/h, janela de seis horas e fórmula;
Ver últimas medições: pequena tabela acessível.
Chuva
chuva observada nas últimas 24 horas;
início e fim do período;
previsão resumida em uma área visualmente separada.
Caixas expansíveis:
Ver outros períodos: 1 h, 6 h, 24 h e 7 dias;
Fonte e modelo: serviço, modelo, emissão, validade e limitações.
Nunca misturar chuva observada com prevista.

# 5. Histórico simplificado

Gráfico do nível nas últimas 24 horas, acompanhado de uma frase como:
Nas últimas seis horas, o nível aumentou 3 cm.

Controles: 24 horas, 7 dias e 30 dias. O gráfico deve:
preservar lacunas;
não inventar valores intermediários;
mostrar cotas apenas depois de validadas;
possuir alternativa “Ver como tabela”.

# 6. Detalhes adicionais

Caixas fechadas por padrão:
“Qualidade e disponibilidade dos dados”
“Fontes e horários de coleta”
“Metodologia e limitações”
“Baixar dados”
Cada caixa deve funcionar por teclado e leitor de tela, com estado aberto/fechado anunciado corretamente.
Hierarquia no celular
A ordem recomendada é:
Situação atual  
Nível e tendência  
Horário e status da medição  
Canais oficiais  
Chuva observada  
Previsão separada  
Histórico simplificado  
Informações técnicas expansíveis  
Fontes e aviso de responsabilidade
Estados que precisam de protótipo
Além do cenário normal, a mesma tela deve ser desenhada para:
dado desatualizado;
fonte indisponível;
medição inconsistente;
estação em manutenção;
tendência indisponível;
cota ainda não validada;
previsão indisponível;
falha parcial;
carregamento.
Em qualquer falha, a última medição válida pode permanecer visível, mas acompanhada de data, hora e aviso destacado. Ausência de dados jamais deve parecer ausência de risco.
Nenhum arquivo foi alterado. A proposta preserva as decisões de arquitetura.txt e regras-de-dados.txt, especialmente divulgação progressiva, prioridade para celular, separação entre medição, cálculo, previsão e comunicado oficial, e transparência sobre qualidade e atualização.