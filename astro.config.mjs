import { defineConfig } from 'astro/config';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://iamnatewinter.com',
  server: { port: 4400, host: true },
  adapter: cloudflare()
});