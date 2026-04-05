# Projeto: Comissionamento-Off

## 🛠 Princípios de Desenvolvimento (XP)
- **TDD Obrigatório:** Escrever testes antes da lógica.
- **Simplicidade (YAGNI):** Focar na solução mais simples primeiro.
- **Documentação Viva:** Manter este arquivo atualizado com decisões de arquitetura.
- **Segurança Nativa:** Validar entradas e proteger fluxos de dados.

## 🏗 Arquitetura
- **Frontend:** React 19 + Vite + TypeScript.
- **Estilo:** Vanilla CSS + Tailwind v4.
- **Banco:** Firebase Firestore + Dexie (Offline-first).
- **IA:** Google Gemini SDK (@google/genai).

## 🧪 Estratégia de Testes
- Framework sugerido: Vitest.
- Foco em unitários para cálculos de comissão e integração para fluxos Firestore.

## 📅 Roadmap / Próximos Passos
- [x] Ativar instrumental de testes (Vitest + JSDOM).
- [x] Implementar Acesso Local (Offline Bypass) na tela de login.
- [ ] Implementar Teste de Fluxo para o Dashboard.

## 💡 Decisões de Arquitetura
- **Acesso Híbrido:** O sistema permite login pelo Google ou Entrada Local (Offline).
- **Dados:** Entrada Local usa uma UID estática `offline-user` para manter persistência no IndexedDB em modo off.
- **Navegação Consolidada:** A navegação é unificada no rodapé, permitindo alternar entre equipamentos da malha e visualizar o status.
- **Visualizador de PDF Real:** Integração do arquivo `ED-E-Z2000-409-02.pdf` via iframe com navegação por hash (#page).
- **Busca Unificada de TAGs:** Sistema de busca no PDF Modal que cruza dados do `pdfIndex.ts` e `instrumentList.ts` (gerado a partir do CSV).

## Comandos Úteis
- Testes: `npx vitest run src/App.test.tsx`
- Conversão CSV: `node -e '...'` (ver histórico de comandos para script one-liner)
