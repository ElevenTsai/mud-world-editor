import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import type { Plugin } from 'vite'

function worldApiPlugin(): Plugin {
  return {
    name: 'world-api',
    configureServer(server) {
      // GET /api/load-world — read all 3 JSON files from data/
      server.middlewares.use('/api/load-world', (req, res) => {
        if (req.method !== 'GET') {
          res.writeHead(405);
          res.end('Method Not Allowed');
          return;
        }
        try {
          const dataDir = resolve(__dirname, 'data');
          const scenes = JSON.parse(readFileSync(resolve(dataDir, 'scenes.json'), 'utf-8'));
          const npcs = JSON.parse(readFileSync(resolve(dataDir, 'npcs.json'), 'utf-8'));
          const items = JSON.parse(readFileSync(resolve(dataDir, 'items.json'), 'utf-8'));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ scenes, npcs, items }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });

      // POST /api/save-world — only write scenes.json
      server.middlewares.use('/api/save-world', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end('Method Not Allowed');
          return;
        }
        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { scenes } = JSON.parse(body);
            const dataDir = resolve(__dirname, 'data');
            writeFileSync(resolve(dataDir, 'scenes.json'), JSON.stringify(scenes, null, 2), 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: (err as Error).message }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), worldApiPlugin()],
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
})
