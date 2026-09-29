import { expect, test as setup } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/user.json";

/** Entra uma vez com a conta de teste e guarda a sessão para os demais testes. */
setup("login com a conta de teste", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  setup.skip(!email || !password, "Defina E2E_EMAIL e E2E_PASSWORD no .env.local");

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email!);
  await page.getByLabel("Senha").fill(password!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await page.context().storageState({ path: AUTH_FILE });
});
