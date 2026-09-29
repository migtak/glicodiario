import { defineConfig, devices } from "@playwright/test";

// credenciais da conta de teste (E2E_EMAIL / E2E_PASSWORD) ficam no .env.local
try {
  process.loadEnvFile(".env.local");
} catch {
  // sem .env.local: os testes que precisam de login são pulados
}

const AUTH_FILE = "e2e/.auth/user.json";

export default defineConfig({
  testDir: "e2e",
  // mesma conta nos dois tamanhos de tela: um teste por vez
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    // usa o Edge já instalado no Windows (sem download de navegadores)
    channel: "msedge",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "celular",
      dependencies: ["setup"],
      use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, storageState: AUTH_FILE },
    },
    {
      name: "desktop",
      dependencies: ["setup"],
      use: { ...devices["Desktop Edge"], channel: "msedge", storageState: AUTH_FILE },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
