import { createClient } from "@supabase/supabase-js";
import { expect, test, type BrowserContext } from "@playwright/test";

test.skip(!process.env.E2E_EMAIL, "Defina E2E_EMAIL e E2E_PASSWORD no .env.local");

// sessão própria (não a compartilhada do setup), porque este teste a encerra
test.use({ storageState: { cookies: [], origins: [] } });

/** Lê os tokens da sessão Supabase guardados nos cookies (podem vir em pedaços .0, .1…). */
async function tokensDoCookie(context: BrowserContext) {
  const cookies = (await context.cookies()).filter((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name));
  const valor = cookies
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((c) => c.value)
    .join("");
  const json = valor.startsWith("base64-") ? Buffer.from(valor.slice(7), "base64url").toString("utf8") : valor;
  const { access_token, refresh_token } = JSON.parse(json);
  return { access_token, refresh_token } as { access_token: string; refresh_token: string };
}

test("sessão encerrada fora do app: ao atualizar, vai para o login e a sessão é apagada", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(process.env.E2E_EMAIL!);
  await page.getByLabel("Senha").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/inicio$/);

  // encerra só ESTA sessão direto no Supabase (como se fosse em outro dispositivo)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.auth.setSession(await tokensDoCookie(context));
  expect(error).toBeNull();
  await supabase.auth.signOut({ scope: "local" });

  // ao atualizar: login com aviso
  await page.reload();
  await expect(page).toHaveURL(/\/login\?aviso=sessao-encerrada$/);
  await expect(page.getByText(/^Sua sessão foi encerrada/)).toBeVisible();

  // os cookies de sessão foram apagados: o app não tenta mais usar a sessão antiga
  expect((await context.cookies()).filter((c) => c.name.startsWith("sb-") && c.value)).toHaveLength(0);
  await page.goto("/inicio");
  await expect(page).toHaveURL(/\/login$/);
});
