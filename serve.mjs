import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '127.0.0.1';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

export function resolveRequestPath(root, requestUrl = '/') {
  const rootPath = resolve(root);
  const rawPath = requestUrl.split('?')[0];
  const decodedPath = decodeURIComponent(rawPath).replace(/\\/g, '/');
  const urlPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const requestPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  const filePath = resolve(rootPath, `.${requestPath}`);
  const relativePath = relative(rootPath, filePath);
  const escapesRoot =
    relativePath === '..' ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath);

  return escapesRoot ? null : filePath;
}

export function createStaticServer(root = process.cwd()) {
  const rootPath = resolve(root);

  return createServer(async (req, res) => {
    try {
      const filePath = resolveRequestPath(rootPath, req.url || '/');
      if (!filePath) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Forbidden');
      }

      const data = await readFile(filePath);
      res.writeHead(200, {
        'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
      });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || DEFAULT_PORT);
  const host = process.env.HOST || DEFAULT_HOST;
  const server = createStaticServer();

  server.listen(port, host, () => {
    console.log(`Serving ${resolve(process.cwd())} at http://${host}:${port}`);
  });
}
