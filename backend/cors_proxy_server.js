const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 5050;

const server = http.createServer(async (req, res) => {
  // Configuración de encabezados CORS para todos los orígenes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const targetUrl = parsedUrl.query.url;

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Uso: http://localhost:5050/?url=https://f005.backblazeb2.com/file/falconi/imagen.jpg' }));
    return;
  }

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      res.writeHead(response.status);
      res.end('Error al recuperar imagen de Backblaze');
      return;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.writeHead(200);
    res.end(buffer);
  } catch (error) {
    console.error('Error en Proxy CORS:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error del servidor proxy CORS' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor Proxy CORS para Backblaze B2 corriendo en http://localhost:${PORT}`);
});
