import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { excluir, marker, registrar } from "./helpers";

test.skip(!process.env.E2E_EMAIL, "Defina E2E_EMAIL e E2E_PASSWORD no .env.local");

async function restaurarFaixas(page: Page) {
  await page.goto("/configuracoes");
  const todas = page.getByRole("button", { name: "Restaurar todas" });
  if (await todas.isVisible()) {
    await todas.click();
    await page.getByRole("button", { name: "Salvar faixas" }).click();
    await expect(page.getByText("Todas seguem o padrão.")).toBeVisible();
  }
}

// a conta de teste é compartilhada: as faixas sempre voltam ao padrão, mesmo se o teste falhar
test.afterEach(async ({ page }) => restaurarFaixas(page));

test("faixa personalizada muda a classificação e pode ser restaurada", async ({ page }) => {
  const obs = marker();

  await page.goto("/configuracoes");
  const jejumAte = page.getByRole("group", { name: /^Jejum/ }).getByLabel("até", { exact: true });
  await expect(jejumAte).toHaveValue("99");
  await jejumAte.fill("110");
  await expect(page.getByRole("group", { name: /^Jejum/ })).toContainText("Personalizado");
  await page.getByRole("button", { name: "Salvar faixas" }).click();
  await expect(page.getByText("1 momento personalizado")).toBeVisible();

  // 105 em jejum: "Atenção" no padrão, "Normal" com a faixa até 110
  await registrar(page, "105", "Jejum", obs);
  await expect(page.getByRole("status")).toContainText("Normal");

  // valor de risco continua alerta mesmo com faixa personalizada
  await page.goto("/configuracoes");
  const jejum = page.getByRole("group", { name: /^Jejum/ });
  await jejum.getByLabel("Normal de").fill("40");
  await page.getByRole("button", { name: "Salvar faixas" }).click();
  await expect(page.getByText("1 momento personalizado")).toBeVisible();
  await page.goto("/registrar");
  await page.getByLabel("Valor do glicosímetro").fill("50");
  await page.getByText("Jejum", { exact: true }).click();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Confirme o valor" })).toBeVisible();

  // faixa inválida é recusada
  await page.goto("/configuracoes");
  await page.getByRole("group", { name: /^Jejum/ }).getByLabel("Atenção até").fill("90");
  await page.getByRole("button", { name: "Salvar faixas" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Jejum:" })).toBeVisible();

  await excluir(page, obs);
});

test("exporta os dados em CSV", async ({ page }) => {
  const obs = marker();
  await registrar(page, "97", "Jejum", obs);
  await expect(page.getByText("Medição salva")).toBeVisible();

  await page.goto("/configuracoes");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Baixar meus dados (CSV)" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^glicodiario-\d{4}-\d{2}-\d{2}\.csv$/);
  const conteudo = await readFile((await download.path())!, "utf8");
  expect(conteudo.charCodeAt(0)).toBe(0xfeff);
  expect(conteudo).toContain("Tipo;Data;Hora;Valor;Unidade;Momento;Classificação;Descrição");
  expect(conteudo).toMatch(new RegExp(`Glicemia;\\d{2}/\\d{2}/\\d{4};\\d{2}:\\d{2};97;mg/dL;Jejum;Normal;${obs}`));

  await excluir(page, obs);
});

test("excluir conta pede confirmação digitada (sem excluir de verdade)", async ({ page }) => {
  await page.goto("/configuracoes");
  await page.getByRole("button", { name: "Excluir minha conta" }).click();
  await page.getByLabel(/Para confirmar/).fill("apagar");
  await page.getByRole("button", { name: "Excluir para sempre" }).click();
  await expect(page.getByText("Digite EXCLUIR para confirmar.")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("button", { name: "Excluir minha conta" })).toBeVisible();
  // continua logado
  await page.goto("/inicio");
  await expect(page).toHaveURL(/\/inicio$/);
});
