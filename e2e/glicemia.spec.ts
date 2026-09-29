import { expect, test, type Page } from "@playwright/test";

test.skip(!process.env.E2E_EMAIL, "Defina E2E_EMAIL e E2E_PASSWORD no .env.local");

/** Marca única na observação, para achar a medição criada por este teste. */
function marker() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function registrar(page: Page, valor: string, momento: string, obs: string) {
  await page.goto("/registrar");
  await page.getByLabel("Valor do glicosímetro").fill(valor);
  await page.getByText(momento, { exact: true }).click();
  await page.getByLabel(/Observação/).fill(obs);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
}

async function abrirNoHistorico(page: Page, obs: string) {
  await page.goto("/historico");
  await page.getByRole("link").filter({ hasText: obs }).click();
  await expect(page.getByRole("heading", { name: "Editar medição" })).toBeVisible();
}

async function excluir(page: Page, obs: string) {
  await abrirNoHistorico(page, obs);
  await page.getByRole("button", { name: "Excluir medição" }).click();
  await page.getByRole("button", { name: "Sim, excluir" }).click();
  await expect(page.getByText("Medição excluída.")).toBeVisible();
  await expect(page.getByText(obs)).toHaveCount(0);
}

test("registrar, ver no histórico, editar e excluir", async ({ page }) => {
  const obs = marker();

  await registrar(page, "105", "Jejum", obs);
  const resultado = page.getByRole("status");
  await expect(resultado).toContainText("Medição salva");
  await expect(resultado).toContainText("Atenção");
  await expect(resultado).toContainText("acima da faixa de referência para jejum");

  // aparece no histórico, inclusive filtrando por "Jejum"
  await page.getByRole("link", { name: "Ver histórico" }).click();
  await page.getByRole("link", { name: "Jejum", exact: true }).click();
  await expect(page).toHaveURL(/contexto=jejum/);
  const linha = page.getByRole("link").filter({ hasText: obs });
  await expect(linha).toContainText("105");

  // editar para 98 → passa a ser "Normal"
  await linha.click();
  await page.getByLabel("Valor do glicosímetro").fill("98");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Alterações salvas.")).toBeVisible();
  const editada = page.getByRole("link").filter({ hasText: obs });
  await expect(editada).toContainText("98");
  await expect(editada).toContainText("Normal");

  await excluir(page, obs);
});

test("valor de risco pede confirmação e mostra alerta", async ({ page }) => {
  const obs = marker();

  await registrar(page, "45", "Aleatório", obs);
  const confirmacao = page.getByRole("alert");
  await expect(confirmacao).toContainText("Confirme o valor: 45 mg/dL");

  // "Corrigir" não salva
  await page.getByRole("button", { name: "Corrigir" }).click();
  await expect(page.getByLabel("Valor do glicosímetro")).toBeFocused();

  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await page.getByRole("button", { name: "Sim, salvar" }).click();
  const alerta = page.getByRole("alert");
  await expect(alerta).toContainText("Muito baixa");
  await expect(alerta).toContainText("procure atendimento médico");

  await excluir(page, obs);
});

test("recusa valor fora do intervalo", async ({ page }) => {
  await page.goto("/registrar");
  const valor = page.getByLabel("Valor do glicosímetro");
  await valor.fill("700");
  await page.getByText("Jejum", { exact: true }).click();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  // validação nativa do navegador impede o envio
  expect(await valor.evaluate((el: HTMLInputElement) => el.validity.rangeOverflow)).toBe(true);
  await expect(page.getByText("Medição salva")).toHaveCount(0);
});
