import { defineConfig } from "vitest/config";
import path from "node:path";

// Los tests de la lógica pura de Curato: horas de París, códigos de visita,
// formatos y categorías. Corren en node, sin navegador ni base de datos.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Las fechas se comprueban en la hora de París, que es la del producto.
    env: { TZ: "Europe/Paris" },
  },
});
