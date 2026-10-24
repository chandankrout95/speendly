import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const dataPath = fileURLToPath(new URL('./data/community.json', import.meta.url));
export const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  if (req.method !== 'GET') { res.writeHead(405).end(JSON.stringify({ error: 'Method not allowed' })); return; }
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/health') { res.end(JSON.stringify({ status: 'ok' })); return; }
    const data = JSON.parse(await readFile(dataPath, 'utf8'));
    if (url.pathname === '/api/community') { res.end(JSON.stringify(data)); return; }
    const resource = url.pathname.replace('/api/', '');
    if (!['services', 'bus', 'ferry', 'doctors', 'camps'].includes(resource)) {
      res.writeHead(404).end(JSON.stringify({ error: 'Not found' })); return;
    }
    let items = data[resource];
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    if (q) items = items.filter(item => JSON.stringify(item).toLowerCase().includes(q));
    if (category && category !== 'All Categories') items = items.filter(item => item.category === category);
    if (status && status !== 'View All') items = items.filter(item => item.status === status);
    res.end(JSON.stringify(items));
  } catch { res.writeHead(500).end(JSON.stringify({ error: 'Could not read the community data file' })); }
});
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(Number(process.env.PORT || 8090), '0.0.0.0', () => console.log('Community API listening on port ' + (process.env.PORT || 8090)));
}
