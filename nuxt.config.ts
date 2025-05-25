import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  css: ['~/assets/main.css'],
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: true,
      port: 3000,
      allowedHosts: ['label.kuubix.be', 'zebra.kuubix.be']
    }
  },
  runtimeConfig: {
    printerHost: process.env.PRINTER_HOST        // server-only
  }

})
