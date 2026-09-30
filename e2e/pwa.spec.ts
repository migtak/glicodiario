import { expect, test, type Page } from "@playwright/test";
import { excluir, marker } from "./helpers";

// O service worker só é registrado na versão de produção:
//   npm run build && npx next start -p 3001, e depois  PWA_URL=http://localhost:3001 npm run e2e -- e2e/pwa.spec.ts
const PWA_URL = process.env.PWA_URL;
test.skip(!PWA_URL || !process.env.E2E_EMAIL, "Rode com PWA_URL apontando para a versão de produção");
// sessão própria: o teste termina com "Sair", que não pode derrubar a sessão compartilhada dos outros testes
test.use({ baseURL: PWA_URL, storageState: { cookies: [], origins: [] } });

async function esperarServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // a partir de agora a página é controlada pelo service worker
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}

const paginasGuardadas = (page: Page) =>
  page.evaluate(async () => {
    const nomes = (await caches.keys()).filter((n) => n.startsWith("glicodiario-paginas"));
    let total = 0;
    for (const n of nomes) total += (await (await caches.open(n)).keys()).length;
    return total;
  });

test("PWA: instalável, abre sem internet e apaga o que guardou ao sair", async ({ page, context, request }) => {
  test.setTimeout(120_000);
  const manifesto = await (await request.get("/manifest.webmanifest")).json();
  expect(manifesto).toMatchObject({ name: "GlicoDiário", start_url: "/inicio", display: "standalone", lang: "pt-BR" });
  expect(manifesto.icons.map((i: { sizes: string }) => i.sizes)).toEqual(["192x192", "512x512", "512x512"]);

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(process.env.E2E_EMAIL!);
  await page.getByLabel("Senha").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await esperarServiceWorker(page);
  // visita com internet: fica guardada no aparelho
  await page.goto("/registrar");
  await expect(page.getByLabel("Valor do glicosímetro")).toBeVisible();
  await page.goto("/historico");
  await expect(page.getByRole("heading", { name: "Histórico" })).toBeVisible();
  expect(await paginasGuardadas(page)).toBeGreaterThan(0);

  await context.setOffline(true);

  // tela já visitada abre sem internet (vinda do service worker)
  const resp = await page.goto("/registrar");
  expect(resp?.fromServiceWorker()).toBe(true);
  await expect(page.getByLabel("Valor do glicosímetro")).toBeVisible();
  await expect(page.getByText("Você está sem internet.")).toBeVisible();

  // e dá para registrar: vai para a fila do aparelho
  const obs = marker();
  await page.getByLabel("Valor do glicosímetro").fill("104");
  await page.getByText("Jejum", { exact: true }).click();
  await page.getByLabel(/Observação/).fill(obs);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText(/Medição guardada neste aparelho/)).toBeVisible();

  // tela nunca visitada: página "Sem internet" em vez de erro do navegador
  await page.goto("/relatorio");
  await expect(page.getByRole("heading", { name: "Sem internet" })).toBeVisible();

  // a internet volta: a fila é enviada ao abrir o app
  await context.setOffline(false);
  await page.goto("/inicio");
  await expect(page.getByText(/aguardando envio/)).toHaveCount(0, { timeout: 15_000 });
  // a medição feita offline aparece no histórico vindo do servidor
  // (recarrega até lá: o navegador de teste leva um instante para religar a rede do service worker)
  await expect
    .poll(async () => {
      await page.goto("/historico");
      return page.getByRole("link").filter({ hasText: obs }).count();
    }, { timeout: 20_000 })
    .toBe(1);
  await excluir(page, obs);

  // ao sair da conta, as páginas guardadas (dados de saúde) são apagadas
  await page.goto("/configuracoes");
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect.poll(() => paginasGuardadas(page)).toBe(0);
});
