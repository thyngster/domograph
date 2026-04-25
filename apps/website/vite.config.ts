import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages serves at https://thyngster.github.io/domograph/, so all
  // built asset URLs must be prefixed with /domograph/. Set BASE_PATH=/ at
  // build time when deploying to a custom domain or root.
  base: process.env.BASE_PATH ?? "/domograph/",
  plugins: [tailwindcss()],
});
