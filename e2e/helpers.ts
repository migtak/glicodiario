import { expect, type Page } from "@playwright/test";

/** Marca única na observação, para achar a medição criada por este teste. */
export function marker() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function registrar(page: Page, valor: string, momento: string, obs: string) {
  await page.goto("/registrar");
  await page.getByLabel("Valor do glicosímetro").fill(valor);
  await page.getByText(momento, { exact: true }).click();
  await page.getByLabel(/Observação/).fill(obs);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
}

export async function abrirNoHistorico(page: Page, obs: string) {
  await page.goto("/historico");
  await page.getByRole("link").filter({ hasText: obs }).click();
  await expect(page.getByRole("heading", { name: /^Editar/ })).toBeVisible();
}

export async function excluir(page: Page, obs: string) {
  await abrirNoHistorico(page, obs);
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  await page.getByRole("button", { name: "Sim, excluir" }).click();
  await expect(page.getByText("Registro excluído.")).toBeVisible();
  await expect(page.getByText(obs)).toHaveCount(0);
}
