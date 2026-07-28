import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from "vite-plugin-svgr";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "CodeGPM",
        short_name: "CodeGPM",
        description: "Group Project Manager",
        theme_color: "#4F46E5",
        background_color: "#0F172A",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
})