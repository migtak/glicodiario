import { expect, test } from "@playwright/test";
import { abrirNoHistorico, excluir, marker } from "./helpers";

test.skip(!process.env.E2E_EMAIL, "Defina E2E_EMAIL e E2E_PASSWORD no .env.local");

test("refeição vinculada a uma glicemia pós-refeição", async ({ page }) => {
  const refeicao = `${marker()} arroz e feijão`;
  const obsGlicemia = marker();

  await page.goto("/registrar?tipo=refeicao");
  await page.getByLabel("O que você comeu?").fill(refeicao);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(`Refeição registrada: ${refeicao}`);

  // glicemia 2h depois: a refeição recente já vem sugerida
  await page.goto("/registrar");
  await page.getByLabel("Valor do glicosímetro").fill("150");
  await expect(page.getByLabel(/Após qual refeição/)).toHaveCount(0); // só aparece em pós-refeição
  await page.getByText("2h após refeição", { exact: true }).click();
  const select = page.getByLabel(/Após qual refeição/);
  await expect(select.locator("option:checked")).toContainText(refeicao.slice(0, 40));
  await page.getByLabel(/Observação/).fill(obsGlicemia);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Medição salva")).toBeVisible();

  await page.goto("/historico");
  await expect(page.getByRole("link").filter({ hasText: obsGlicemia })).toContainText(`Após: ${refeicao}`);

  // a edição da glicemia mantém a refeição vinculada
  await abrirNoHistorico(page, obsGlicemia);
  await expect(page.getByLabel(/Após qual refeição/).locator("option:checked")).toContainText(refeicao.slice(0, 40));

  await excluir(page, obsGlicemia);
  await excluir(page, refeicao);
});

test("atividade física: registrar outra atividade, editar e excluir", async ({ page }) => {
  const nome = marker();

  await page.goto("/registrar?tipo=atividade");
  await page.getByText("Outra", { exact: true }).click();
  await page.getByLabel("Qual atividade?").fill(nome);
  await page.getByLabel("Duração").fill("45");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(`Atividade registrada: ${nome}, 45 min`);

  await page.goto("/historico?tipo=atividade");
  await expect(page.getByRole("link").filter({ hasText: nome })).toContainText("45 min");

  await abrirNoHistorico(page, nome);
  await expect(page.getByLabel("Qual atividade?")).toHaveValue(nome);
  await page.getByLabel("Duração").fill("90");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Alterações salvas.")).toBeVisible();
  await expect(page.getByRole("link").filter({ hasText: nome })).toContainText("1h30");

  await excluir(page, nome);
});

test("peso: aceita vírgula, edita e exclui", async ({ page }) => {
  // valor improvável, para achar a linha criada por este teste
  const inteiro = 150 + Math.floor(Math.random() * 50);
  const peso = `${inteiro},37`;

  await page.goto("/registrar?tipo=peso");
  await page.getByLabel("Peso", { exact: true }).fill(peso);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(`Peso registrado: ${peso} kg`);

  // filtro por tipo mostra só pesos
  await page.goto("/historico?tipo=peso");
  await expect(page.getByRole("link").filter({ hasText: `${peso} kg` })).toBeVisible();
  await expect(page.getByText("Momento da glicemia")).toHaveCount(0);

  await abrirNoHistorico(page, `${peso} kg`);
  await expect(page.getByLabel("Peso", { exact: true })).toHaveValue(peso);
  const novo = `${inteiro},12`;
  await page.getByLabel("Peso", { exact: true }).fill(novo);
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Alterações salvas.")).toBeVisible();

  await excluir(page, `${novo} kg`);
});
