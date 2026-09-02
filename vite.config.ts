import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Runs the /api/generate serverless function during `npm run dev`
 * (plain Vite does not execute the api/ folder - only `vercel dev` does).
 */
function apiDevServer(): Plugin {
  return {
    name: 'api-generate-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/generate')) return next();

        const fail = (message: string) => {
          try {
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('content-type', 'application/json');
            }
            res.end(JSON.stringify({ error: `Dev API error: ${message}` }));
          } catch {
            /* connection already gone */
          }
        };

        (async () => {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);

          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === 'string') headers[k] = v;
            else if (Array.isArray(v)) headers[k] = v.join(', ');
          }

          const request = new Request(`http://localhost${url}`, {
            method: req.method || 'GET',
            headers,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          });

          const mod = await server.ssrLoadModule('/api/generate.ts');
          const handler = mod.default as (r: Request) => Promise<Response>;
          const response = await handler(request);

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));

          if (response.body) {
            const reader = response.body.getReader();
            try {
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                if (!res.writableEnded) res.write(Buffer.from(value));
              }
            } catch {
              /* client disconnected mid-stream */
            } finally {
              reader.cancel().catch(() => {});
            }
          }
          if (!res.writableEnded) res.end();
        })().catch((err) => fail(err instanceof Error ? err.message : String(err)));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // expose server-side vars to the dev API handler
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.GEMINI_MODEL) process.env.GEMINI_MODEL = env.GEMINI_MODEL;

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), apiDevServer()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
