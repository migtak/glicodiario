# GlicoDiário — Definição do Projeto

> Nome provisório. Documento de premissas construído via entrevista em 29/09/2026.
> Serve de referência para o desenvolvimento (inclusive para uso com o Claude Code).

## 1. Visão geral

Aplicação web **responsiva** para registrar e acompanhar a glicemia (nível de açúcar no sangue) no dia a dia. Funciona em computadores e celulares de qualquer tamanho de tela e pode ser instalada como app no celular (PWA), inclusive funcionando offline.

- **Objetivo do projeto:** aprendizado/treinamento, mas com qualidade para ser usado de verdade.
- **Público-alvo:** uso pessoal/familiar. Pessoas com **pré-diabetes** ou curiosas em acompanhar a própria glicemia.
- **Fora do público-alvo (por ora):** diabetes tipo 1, tipo 2 insulinodependente e gestacional. Por isso não há controle de insulina, contagem de carboidratos nem metas gestacionais.

## 2. Aviso importante (premissa inegociável)

O app é **informativo e educativo**. **Não** é dispositivo médico, **não** faz diagnóstico e **não** recomenda tratamento.

- Exibir um aviso visível no primeiro acesso e na tela "Sobre": *"Este aplicativo não substitui orientação médica. Os valores de referência são informativos. Em caso de dúvida ou valores alterados, procure um profissional de saúde."*
- A linguagem deve evitar afirmações como "você tem diabetes". Usar "valor acima da faixa de referência".
- Obs.: software que diagnostica ou orienta tratamento pode ser enquadrado como dispositivo médico pela ANVISA (RDC 657/2022). Manter o escopo informativo evita isso.

## 3. Glossário rápido

| Termo | Significado |
|---|---|
| Glicemia | Concentração de glicose (açúcar) no sangue, medida em **mg/dL** |
| Glicosímetro | Aparelho de ponta de dedo que mede a glicemia na hora |
| Jejum | Medição após pelo menos 8h sem comer (normalmente ao acordar) |
| Pós-prandial | Medição depois de uma refeição (1h ou 2h após o início) |
| Hipoglicemia | Glicemia baixa (< 70 mg/dL). Pode causar tremor, suor e confusão |
| Hiperglicemia | Glicemia alta |
| Pré-diabetes | Glicemia acima do normal, mas abaixo do critério de diabetes |
| HbA1c | Exame de laboratório que reflete a média dos últimos ~3 meses (fora do escopo atual) |
| CGM | Sensor de glicose contínuo, como o FreeStyle Libre (fora do escopo atual) |

## 4. Premissas definidas

| Tema | Decisão |
|---|---|
| Usuários | Uma conta = uma pessoa (sem múltiplos perfis por conta) |
| Entrada de dados | Digitação manual (valor lido no glicosímetro) |
| Unidade | Somente **mg/dL** |
| Contexto da medição | **Obrigatório**, a partir de uma lista fixa (ver §5) |
| Dados extras | Refeições (texto livre), atividade física e peso |
| Classificação | Cores por faixa, mais aviso para procurar médico em valores extremos |
| Faixas de referência | Padrão SBD/ADA, **editáveis** pelo usuário |
| Armazenamento | Nuvem com login e sincronização entre dispositivos |
| Plataforma | PWA instalável e **offline-first** (registra sem internet e sincroniza depois) |
| Idioma | Português (BR) |
| Acessibilidade | WCAG 2.1 AA: bom contraste, fontes legíveis, alvos de toque grandes e cor nunca como única informação |
| Stack | Next.js (React + TypeScript) + Supabase (Postgres, Auth, RLS), deploy na Vercel |
| Lembretes | Fora do MVP (fase futura) |

## 5. Contexto da medição e faixas de referência

Cada medição tem um contexto obrigatório:

`Jejum` · `Antes da refeição` · `1h após refeição` · `2h após refeição` · `Antes de dormir` · `Aleatório`

### Faixas padrão (mg/dL), editáveis pelo usuário

| Contexto | 🟢 Normal | 🟡 Atenção | 🔴 Alto |
|---|---|---|---|
| Jejum | 70–99 | 100–125 (faixa de pré-diabetes) | ≥ 126 |
| 2h após refeição | 70–139 | 140–199 | ≥ 200 |
| 1h após / antes da refeição / antes de dormir / aleatório | 70–139 | 140–199 | ≥ 200 |

**Faixas de segurança (valem para qualquer contexto, sempre mostram aviso):**

| Faixa | Classificação | Mensagem |
|---|---|---|
| < 54 | 🔴 Hipoglicemia importante | Orientar ingerir açúcar rápido e **procurar atendimento** |
| 54–69 | 🟠 Hipoglicemia | Orientar ingerir açúcar rápido e medir de novo em 15 min |
| ≥ 250 | 🔴 Muito alta | Orientar **procurar atendimento médico** |

Fontes: Sociedade Brasileira de Diabetes (SBD) e American Diabetes Association (ADA).
⚠️ As faixas de jejum e 2h pós-refeição seguem critérios oficiais. As dos demais contextos são **aproximações informativas** e devem ser validadas com um profissional de saúde (ver §10).

## 6. Funcionalidades do MVP

### 6.1 Conta
- Cadastro/login com e-mail e senha (Supabase Auth). Login com Google é opcional.
- Recuperação de senha.
- Excluir conta e todos os dados (LGPD).
- Aceite do aviso médico e da política de privacidade no cadastro.

### 6.2 Registro de glicemia
- Campos: **valor (mg/dL)**, **contexto**, **data/hora** (padrão: agora) e observação opcional.
- Validação: valor entre 20 e 600 mg/dL. Fora disso, pedir confirmação.
- Feedback imediato após salvar: cor e texto da classificação.
- Editar e excluir registros.
- O registro deve ser rápido no celular: no máximo 3 toques depois de abrir o app.

### 6.3 Registros complementares
- **Refeição:** data/hora e descrição livre. Pode ser vinculada a uma medição pós-refeição.
- **Atividade física:** data/hora, tipo (texto ou lista simples) e duração em minutos.
- **Peso:** data e valor em kg.

### 6.4 Visualizações
- **Histórico em lista:** ordem cronológica, filtros por período e contexto, com cor por classificação.
- **Gráfico de evolução:** períodos de 7, 30 e 90 dias. Faixa normal sombreada, pontos coloridos por classificação e marcadores de refeição e atividade.
- **Resumo/estatísticas por período:** média geral e por contexto (ex.: média em jejum), % de valores dentro da faixa, maior e menor valor, número de medições e evolução do peso.
- **Relatório para o médico:** página otimizada para impressão ou PDF, com período, estatísticas, gráfico e tabela de medições.

### 6.5 Configurações
- Editar faixas de referência, com botão "restaurar padrão".
- Exportar dados em CSV (backup e portabilidade, LGPD).

## 7. Requisitos não funcionais

- **Responsividade:** mobile-first, de 320px a monitores largos. Navegação inferior no celular e lateral no desktop.
- **PWA:** manifest, ícones, service worker e instalação em Android, iOS e desktop.
- **Offline-first:** registros criados offline ficam numa fila local (IndexedDB) e sincronizam ao reconectar, com indicador visual de "pendente de sincronização".
- **Segurança e LGPD:** dados de saúde são **dados sensíveis**.
  - Row Level Security no Supabase: cada usuário só acessa os próprios dados.
  - HTTPS obrigatório. Nenhum dado de saúde em logs ou analytics.
  - Política de privacidade simples, com direito de exportar e excluir os dados.
- **Datas e horas:** armazenar em UTC e exibir no fuso do usuário (America/Sao_Paulo por padrão). Formato brasileiro (dd/mm/aaaa, 24h).
- **Qualidade:** TypeScript estrito, testes unitários da lógica de classificação (faixas) e testes E2E dos fluxos principais.

## 8. Modelo de dados (rascunho)

```
profiles        (id = auth.users.id, nome, criado_em)
glucose_readings(id, user_id, valor_mg_dl, contexto, medido_em, observacao, meal_id?, criado_em, atualizado_em)
meals           (id, user_id, descricao, ocorreu_em)
activities      (id, user_id, tipo, duracao_min, ocorreu_em)
weights         (id, user_id, peso_kg, medido_em)
target_ranges   (id, user_id, contexto, normal_min, normal_max, atencao_max)
```
Todas as tabelas com RLS (`user_id = auth.uid()`). IDs em UUID gerados no cliente, para permitir criação offline.

## 9. Fora do escopo (backlog futuro)

- Lembretes e notificações push (há limitações de PWA no iOS)
- Registro de HbA1c e outros exames de laboratório
- Importação de CSV de glicosímetros ou do LibreView
- Integração com sensores contínuos (CGM)
- Controle de insulina e medicamentos, contagem de carboidratos
- Múltiplos perfis por conta ou compartilhamento com médico/cuidador
- Suporte a mmol/L e outros idiomas
- Suporte a diabetes tipo 1, tipo 2 com insulina e gestacional

## 10. Pontos em aberto

- [ ] Definir o nome final do app.
- [ ] Validar com um profissional de saúde as faixas dos contextos sem critério oficial (1h após, antes da refeição, antes de dormir, aleatório) e as mensagens de alerta.
- [ ] Redigir o texto da política de privacidade e do aviso médico.
- [ ] Definir identidade visual (paleta com cores de classificação acessíveis também para daltônicos).
