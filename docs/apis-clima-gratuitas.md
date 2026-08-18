# APIs de clima gratuitas recomendadas

## 1. INMET — fonte oficial para observações e avisos no Brasil

### Uso recomendado
- Dados observados por estações meteorológicas brasileiras.
- Avisos meteorológicos oficiais.
- Validação das condições registradas no território nacional.

### Cuidados
- Os serviços públicos podem apresentar instabilidade.
- Manter cache e preservar a última medição válida.
- Não misturar observação oficial com previsão de modelo.

### Referência

[Portal do INMET](https://portal.inmet.gov.br/)

### Como solicitar ou acessar

- Os dados públicos podem ser consultados gratuitamente pelo [portal de dados do INMET](https://portal.inmet.gov.br/) e pelo [BDMEP](https://bdmep.inmet.gov.br/).
- Os avisos meteorológicos estão disponíveis no [portal de alertas do INMET](https://alertas2.inmet.gov.br/).
- Para solicitar acesso específico, documentação de integração ou esclarecimentos sobre API, use o [canal oficial de contato e acesso à informação](https://portal.inmet.gov.br/contato/internet).


## 2. Open-Meteo — previsão meteorológica principal

### Uso recomendado
- Previsão horária de precipitação, temperatura, vento e umidade.
- Consulta por latitude e longitude, sem necessidade de chave de API.
- Previsões baseadas em diferentes modelos meteorológicos.

### Condições da modalidade gratuita
- Até 10.000 chamadas por dia.
- Destinada a uso não comercial.
- Exige atribuição dos dados conforme a licença CC BY 4.0.
- Não oferece garantia de disponibilidade.

### Referências

- [Open-Meteo](https://open-meteo.com/)
- [Preços e limites](https://open-meteo.com/en/pricing)

### Como solicitar ou acessar

- A modalidade pública não exige cadastro nem chave de API.
- Monte e teste a requisição diretamente na [documentação interativa da Forecast API](https://open-meteo.com/en/docs).
- Para uso comercial ou limites maiores, escolha um plano na [página de preços](https://open-meteo.com/en/pricing).


## 3. MET Norway — fonte de contingência para previsão

### Uso recomendado
- Previsão global para até nove dias.
- Alternativa quando a fonte principal estiver indisponível.
- Resposta em JSON por meio do endpoint Locationforecast.

### Cuidados
- Identificar corretamente a aplicação no cabeçalho User-Agent.
- Respeitar as regras de atribuição e armazenamento em cache.
- Consultar pelo backend, evitando chamadas diretas de cada navegador.

### Referência

[Documentação do Locationforecast](https://api.met.no/weatherapi/locationforecast/2.0/documentation)

### Como solicitar ou acessar

- Não é necessário cadastro nem chave para a API pública.
- Comece pelo [guia oficial de acesso](https://developer.yr.no/doc/GettingStarted/).
- Consulte e teste o endpoint na [documentação do Locationforecast](https://api.met.no/weatherapi/locationforecast/2.0/documentation).
- A aplicação deve enviar um `User-Agent` identificável, conforme as regras do serviço.


## 4. NASA POWER — dados históricos e análises agroclimáticas

### Uso recomendado
- Séries históricas de temperatura, precipitação e radiação solar.
- Estudos climáticos, agrícolas, energéticos e de infraestrutura.
- Dados horários, diários, mensais, anuais e climatológicos.

### Cuidados
- A resolução meteorológica é de aproximadamente 0,5 grau, cerca de 50 km.
- Não deve ser usada como fonte principal para alertas locais em tempo real.
- Evitar consultas repetidas para a mesma célula geográfica.

### Referência

[Documentação da API NASA POWER](https://power.larc.nasa.gov/docs/services/api/)

### Como solicitar ou acessar

- A API pública não exige cadastro nem chave.
- Use a [documentação interativa da API](https://power.larc.nasa.gov/api/pages/) para montar e testar consultas.
- Consulte o [guia oficial de primeiros passos](https://power.larc.nasa.gov/docs/tutorials/api-getting-started/) para exemplos de integração.


## Arquitetura sugerida

- Usar o INMET para observações e avisos oficiais.
- Usar a Open-Meteo para previsão meteorológica horária.
- Usar a MET Norway como contingência da previsão.
- Usar a NASA POWER para histórico e análises agroclimáticas.
- Consultar as APIs por funções do backend da Vercel.
- Armazenar os resultados no Neon e atualizar a cada 15 a 30 minutos.
- Fazer o navegador consultar o backend ou o banco, e não diretamente as APIs externas.
- Exibir claramente a fonte, o horário de atualização e se o dado é observado ou previsto.
