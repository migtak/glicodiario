import { expect, test } from "@playwright/test";
import { excluir, marker, registrar } from "./helpers";

test.skip(!process.env.E2E_EMAIL, "Defina E2E_EMAIL e E2E_PASSWORD no .env.local");

test("gráficos: resumo e detalhes do ponto ao passar o mouse", async ({ page }) => {
  const obs = marker();
  await registrar(page, "245", "Aleatório", obs);
  await expect(page.getByText("Medição salva")).toBeVisible();

  await page.goto("/graficos?periodo=7");
  await expect(page.getByRole("heading", { name: "Resumo dos últimos 7 dias" })).toBeVisible();
  await expect(page.getByText("Média geral")).toBeVisible();
  await expect(page.getByText("Dentro da faixa")).toBeVisible();
  await expect(page.getByRole("table", { name: /Média de glicemia por momento/ })).toContainText("Aleatório");

  // o ponto de 245 mg/dL é "Alta": procura entre os pontos vermelhos o que mostra 245
  const grafico = page.getByRole("img", { name: /Gráfico da glicemia/ });
  await grafico.scrollIntoViewIfNeeded();
  const tooltip = page.locator("div[role=status]").filter({ hasText: "mg/dL" });
  const pontos = grafico.locator("circle.fill-glu-high");
  let achou = false;
  for (let i = 0; i < (await pontos.count()) && !achou; i++) {
    const box = (await pontos.nth(i).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    achou = (await tooltip.count()) > 0 && (await tooltip.innerText()).includes("245 mg/dL");
  }
  expect(achou, "tooltip com 245 mg/dL").toBe(true);
  await expect(tooltip).toContainText("Alta");
  await expect(tooltip).toContainText("Aleatório");

  // filtro por momento mantém só os pontos daquele momento
  await page.getByRole("link", { name: "Aleatório", exact: true }).click();
  await expect(page).toHaveURL(/contexto=aleatorio/);
  await expect(page.getByRole("img", { name: /Gráfico da glicemia/ }).locator("circle.fill-glu-high")).not.toHaveCount(0);

  await excluir(page, obs);
});
