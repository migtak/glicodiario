import { expect, test } from "@playwright/test";
import { excluir, marker, registrar } from "./helpers";

test.skip(!process.env.E2E_EMAIL, "Defina E2E_EMAIL e E2E_PASSWORD no .env.local");

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
  const confirmacao = page.getByRole("alert").filter({ hasText: "Confirme o valor" });
  await expect(confirmacao).toContainText("Confirme o valor: 45 mg/dL");

  // "Corrigir" não salva
  await page.getByRole("button", { name: "Corrigir" }).click();
  await expect(page.getByLabel("Valor do glicosímetro")).toBeFocused();

  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await page.getByRole("button", { name: "Sim, salvar" }).click();
  const alerta = page.getByRole("alert").filter({ hasText: "Medição salva" });
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

test("nenhuma tela tem rolagem lateral", async ({ page }) => {
  const obs = marker();
  // com uma medição na lista, para o histórico ter conteúdo
  await registrar(page, "92", "Jejum", obs);
  await expect(page.getByText("Medição salva")).toBeVisible();

  for (const path of ["/inicio", "/registrar", "/historico", "/graficos", "/configuracoes"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `rolagem lateral em ${path}`).toBeLessThanOrEqual(0);
  }

  await excluir(page, obs);
});
