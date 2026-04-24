import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Vite plugin that exposes REST API endpoints to read/write SQL files in data/.
 *
 * GET  /api/sql-files          → { files: ["seed_xxx.sql", ...] }
 * GET  /api/sql-files/:name    → raw SQL text
 * POST /api/sql-files          → body: { files: { "seed_xxx.sql": "...", ... } }
 */
export function sqlFilesPlugin(): Plugin {
  const dataDir = path.resolve(process.cwd(), 'data');

  return {
    name: 'sql-files-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';

        // List SQL files
        if (req.method === 'GET' && url === '/api/sql-files') {
          try {
            const files = fs.readdirSync(dataDir)
              .filter(f => f.endsWith('.sql'))
              .sort();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ files }));
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to list SQL files' }));
          }
          return;
        }

        // Read a single SQL file
        const readMatch = url.match(/^\/api\/sql-files\/(.+\.sql)$/);
        if (req.method === 'GET' && readMatch) {
          const fileName = decodeURIComponent(readMatch[1]);
          const filePath = path.join(dataDir, fileName);
          if (!filePath.startsWith(dataDir)) {
            res.statusCode = 403;
            res.end(JSON.stringify({ error: 'Forbidden' }));
            return;
          }
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(content);
          } catch {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: `File not found: ${fileName}` }));
          }
          return;
        }

        // Write SQL files (batch)
        if (req.method === 'POST' && url === '/api/sql-files') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { files } = JSON.parse(body) as { files: Record<string, string> };
              if (!files || typeof files !== 'object') {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid body: expected { files: { ... } }' }));
                return;
              }
              if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
              }
              // Delete existing SQL files not in the new set
              const existingFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.sql'));
              for (const f of existingFiles) {
                if (!(f in files)) {
                  fs.unlinkSync(path.join(dataDir, f));
                }
              }
              for (const [name, content] of Object.entries(files)) {
                const filePath = path.join(dataDir, name);
                if (!filePath.startsWith(dataDir)) continue;
                fs.writeFileSync(filePath, content, 'utf-8');
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, written: Object.keys(files) }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: `Write failed: ${(err as Error).message}` }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
