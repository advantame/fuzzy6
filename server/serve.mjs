import { createServer, STATUS_CODES } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createStaticApp, SECURITY_HEADERS } from './static.mjs';

try {
  const port = process.env.PORT ?? '8080';
  if (!/^[0-9]+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error();
  const respond = await createStaticApp(fileURLToPath(new URL('../dist/', import.meta.url)));
  const handle = (req, res) => {
    // A wall-clock deadline also bounds a peer that keeps dribbling bytes.
    const deadline = setTimeout(() => res.destroy(), 15000);
    deadline.unref();
    res.on('close', () => clearTimeout(deadline));
    const result = respond(req);
    console.log(`${req.method === 'GET' || req.method === 'HEAD' ? req.method : 'OTHER'} ${result.route} ${result.status}`);
    // No body is consumed or buffered. Closing each response also bounds pipelining
    // and unread request bodies, while browsers can use parallel connections.
    res.writeHead(result.status, { ...result.headers, Connection: 'close' });
    res.end(result.body);
  };
  const server = createServer({
    headersTimeout: 10000, requestTimeout: 15000,
    connectionsCheckingInterval: 1000, keepAliveTimeout: 2000,
    maxHeaderSize: 16384,
  }, handle);
  // Avoid Node's automatic 100/417 responses without our security headers.
  server.on('checkContinue', handle);
  server.on('checkExpectation', handle);
  // The byte limit already bounds headers. Do not truncate rawHeaders by count,
  // which could otherwise hide a duplicate X-App-User late in the header block.
  server.maxHeadersCount = 0;
  server.maxConnections = 128;
  server.setTimeout(15000, socket => socket.destroy());
  // Parser errors (including header/request timeout) need the same safe headers.
  const protocolError = (socket, status) => {
    if (!socket.writable || socket.destroyed) return socket.destroy();
    console.log(`OTHER protocol ${status}`);
    const headers = { ...SECURITY_HEADERS, 'Cache-Control': 'no-store', 'Content-Length': '0', Connection: 'close' };
    socket.end(`HTTP/1.1 ${status} ${STATUS_CODES[status]}\r\n${Object.entries(headers).map(([k, v]) => `${k}: ${v}\r\n`).join('')}\r\n`);
    socket.setTimeout(1000, () => socket.destroy());
  };
  server.on('clientError', (error, socket) => protocolError(socket,
    error.code === 'ERR_HTTP_REQUEST_TIMEOUT' ? 408 : error.code === 'HPE_HEADER_OVERFLOW' ? 431 : 400));
  server.on('connect', (_req, socket) => protocolError(socket, 405));
  server.on('upgrade', (_req, socket) => protocolError(socket, 400));
  const shutdown = () => {
    server.close();
    server.closeAllConnections();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  server.on('error', () => {
    console.log('server startup failed');
    process.exitCode = 1;
    shutdown();
  });
  server.listen(Number(port), '0.0.0.0', () => console.log('server ready'));
} catch {
  // Never print exception details: they can contain paths or environment values.
  console.log('server startup failed');
  process.exitCode = 1;
}
