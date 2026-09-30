import { expect, test } from "@playwright/test";
import { excluir, marker } from "./helpers";

test.skip(!process.env.E2E_EMAIL, "Defina E2E_EMAIL e E2E_PASSWORD no .env.local");

test("sem internet: guarda no aparelho e envia sozinho quando a conexão volta", async ({ page, context }) => {
  const obs = marker();
  const refeicao = `${marker()} lanche offline`;

  // página aberta com internet; depois a conexão cai
  await page.goto("/registrar");
  await expect(page.getByLabel("Valor do glicosímetro")).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByText("Você está sem internet.")).toBeVisible();

  await page.getByLabel("Valor do glicosímetro").fill("112");
  await page.getByText("Jejum", { exact: true }).click();
  await page.getByLabel(/Observação/).fill(obs);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText(/Medição guardada neste aparelho/)).toBeVisible();
  await expect(page.getByText("Sem internet agora: ela será enviada sozinha quando a conexão voltar.")).toBeVisible();
  await expect(page.getByText("1 registro aguardando envio")).toBeVisible();

  // a validação continua valendo offline
  await page.getByRole("button", { name: "Registrar outra" }).click();
  await page.getByLabel("Valor do glicosímetro").fill("700");
  await page.getByText("Jejum", { exact: true }).click();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  expect(await page.getByLabel("Valor do glicosímetro").evaluate((el: HTMLInputElement) => el.validity.rangeOverflow)).toBe(true);

  // a conexão volta: a fila é enviada sem ninguém clicar em nada
  await context.setOffline(false);
  await expect(page.getByText(/aguardando envio/)).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByText("Você está sem internet.")).toHaveCount(0);

  // e aparece no histórico, vindo do servidor
  await page.goto("/historico");
  await expect(page.getByRole("link").filter({ hasText: obs })).toContainText("112");

  // refeição offline pela aba de refeição (página já carregada antes de cair a rede)
  await page.goto("/registrar?tipo=refeicao");
  await expect(page.getByLabel("O que você comeu?")).toBeVisible();
  await context.setOffline(true);
  await page.getByLabel("O que você comeu?").fill(refeicao);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Guardado neste aparelho" })).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText(/aguardando envio/)).toHaveCount(0, { timeout: 15_000 });

  await excluir(page, obs);
  await excluir(page, refeicao);
});

test("sem internet: editar mostra aviso em vez de quebrar a tela", async ({ page, context }) => {
  const obs = marker();
  await page.goto("/registrar");
  await page.getByLabel("Valor do glicosímetro").fill("99");
  await page.getByText("Jejum", { exact: true }).click();
  await page.getByLabel(/Observação/).fill(obs);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Medição salva")).toBeVisible();

  await page.goto("/historico");
  await page.getByRole("link").filter({ hasText: obs }).click();
  await expect(page.getByRole("heading", { name: "Editar medição" })).toBeVisible();
  await context.setOffline(true);
  await page.getByLabel("Valor do glicosímetro").fill("98");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText(/Sem internet: alterações e exclusões só podem ser salvas com conexão/)).toBeVisible();
  await context.setOffline(false);

  await excluir(page, obs);
});
