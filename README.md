1. PRD: App de Fichas de Comissionamento (Offline First)
Objetivo do Produto
Automatizar e facilitar o preenchimento da Ficha de Liberação de Montagem e Testes
, eliminando erros de transcrição e permitindo a consulta rápida a dados técnicos de projeto em ambientes sem conectividade.
Público-Alvo
Equipes de campo, montagem elétrica e instrumentação da Votorantim Cimentos (Fábrica de Edealina - GO)
.
Principais Funcionalidades
Busca por TAG: O usuário digita ou seleciona o TAG (ex: Z2P32M1) e o app recupera automaticamente os dados vinculados
.
Auto-preenchimento (Look-up):
Dados Técnicos do Instrumento: Extraídos da planilha ED-I-Z2000-120-05 (Fabricante, Modelo, Range, Tipo de Sinal)
.
Endereço IP da Gaveta: Extraído do documento ED-E-Z2000-409-02.pdf
.
Entrada de Dados Manual: Campos para informações coletadas na placa do equipamento (Nº de série, Fator de Potência, etc.) e resultados de testes (Checklists, medição de isolação)
.
Operação Offline: Banco de dados local sincronizado que permite salvar e editar fichas sem internet.
Exportação em PDF: Gerar um arquivo final com layout idêntico à ficha padrão Z2P32M1.pdf
.

--------------------------------------------------------------------------------
2. Mapeamento de Dados para Integração
Para que o APP funcione, a base de dados interna deve correlacionar as fontes da seguinte forma:
Campo na Ficha (Z2P32M1.pdf)
Origem do Dado (Fonte de Referência)
Exemplo de Dado
Tag do Equipamento
Planilha ED-I-Z2000-120-05 (Coluna TAG VC)
Z2J10M1
Descrição
Planilha ED-I-Z2000-120-05 (Coluna EQUIPAMENTO)
ELEVADOR DE CANECAS
Fabricante/Modelo
Planilha ED-I-Z2000-120-05 (Colunas FABRICANTE / MODELO)
KELIANG / WZP22B-32000
Endereço IP da Gaveta
PDF ED-E-Z2000-409-02.pdf (Campo: ENDEREÇO IP)
100.68.31.197
CCM / Gaveta
PDF ED-E-Z2000-409-02.pdf (Campos: CCM e GAVETA)
SU7.1-CCM-P1-3 / 5G
Range do Instrumento
Planilha ED-I-Z2000-120-05 (Colunas RANGE MÍN/MÁX)
0ºC a 200ºC
Nº de Série / Data
Placa do Equipamento / Entrada Manual do Usuário
Inserido em campo

--------------------------------------------------------------------------------
3. Instruções para o Desenvolvimento
Para garantir o sucesso do APP, siga estes passos:
A. Extração e Preparação de Dados:
Planilha Excel: Converta as abas "MOAGEM DE CIMENTO" e "TRANSPORTE" em arquivos CSV ou JSON. Isso facilitará a importação para o banco de dados do aplicativo (como SQLite ou Realm)
.
PDF de Diagramas (IPs): Como os endereços IP estão em diagramas de interligação, você precisará mapear os TAGs aos seus respectivos IPs manualmente ou via OCR para criar uma tabela de consulta
.
B. Arquitetura Offline:
Implemente o conceito de Offline First. O banco de dados mestre deve residir no celular.
Crie uma fila de sincronização: quando o app detectar sinal de Wi-Fi ou 4G, ele deve enviar as fichas salvas para o servidor central (Google Drive ou Banco em Nuvem).
C. Interface do Usuário (UI):
Fluxo de Preenchimento: A tela inicial deve ser uma busca por TAG. Ao selecionar o TAG, o app deve "travar" a descrição e o IP, preenchendo-os automaticamente
.
Validação: Campos de "Range" devem validar se o valor inserido pelo usuário está dentro do limite especificado no projeto
.
D. Geração de Documentos:
Use uma biblioteca de geração de PDF (como PDFKit ou similares) para sobrepor os dados coletados sobre o template original da Votorantim
.
Atenção: Vários itens na planilha de Moagem possuem a marcação "PENDENTE SINOMA" ou "PENDENTE VOTORANTIM"
. O APP deve permitir que o usuário edite esses campos caso a informação já esteja disponível na placa física do equipamento durante a montagem.