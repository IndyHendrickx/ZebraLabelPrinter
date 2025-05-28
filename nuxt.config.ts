import tailwindcss from '@tailwindcss/vite'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  compatibilityDate: "2025-05-26",
  css: ['~/assets/main.css'],
  devServer:{
    host: "0.0.0.0",
    port: 3000,
    url: "label.kuubix.be"
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
    },
    preview: {
      port: 3000,
      strictPort: true,
      host: "0.0.0.0"
    },
  },
  runtimeConfig: {
    printerHost: process.env.PRINTER_HOST
  }

})
