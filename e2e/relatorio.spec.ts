import { expect, test } from "@playwright/test";
import { excluir, marker, registrar } from "./helpers";

test.skip(!process.env.E2E_EMAIL, "Defina E2E_EMAIL e E2E_PASSWORD no .env.local");

test("relatório para o médico: conteúdo e versão de impressão", async ({ page }) => {
  const obs = marker();
  await registrar(page, "131", "Jejum", obs);
  await expect(page.getByText("Medição salva")).toBeVisible();

  // chega pelo botão da tela de Gráficos, mantendo o período
  await page.goto("/graficos?periodo=7");
  await page.getByRole("link", { name: "Relatório para o médico" }).click();
  await expect(page).toHaveURL(/\/relatorio\?periodo=7$/);

  await expect(page.getByText("GlicoDiário · Relatório de glicemia")).toBeVisible();
  await expect(page.getByText(/Período: .* \(7 dias\)/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Resumo da glicemia" })).toBeVisible();
  await expect(page.getByText("Padrão SBD/ADA (não personalizadas pelo paciente).")).toBeVisible();
  const linha = page.getByRole("row").filter({ hasText: obs });
  await expect(linha).toContainText("Jejum");
  await expect(linha).toContainText("131");
  await expect(linha).toContainText("Alta");

  // no papel: sem navegação, sem botões, sem filtros
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: "Imprimir ou salvar PDF" })).toBeHidden();
  await expect(page.getByRole("link", { name: "Voltar aos gráficos" })).toBeHidden();
  // (getByRole ignora elementos escondidos, por isso o seletor direto)
  const navs = page.locator('nav[aria-label="Navegação principal"]');
  await expect(navs).toHaveCount(2);
  for (const nav of await navs.all()) await expect(nav).toBeHidden();
  await expect(page.getByRole("heading", { name: "Todas as medições" })).toBeVisible();
  await page.emulateMedia({ media: "screen" });

  await excluir(page, obs);
});
