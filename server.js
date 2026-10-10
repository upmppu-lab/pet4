import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const assetsDir = path.join(__dirname, 'assets');
const RAW_BASE = 'https://raw.githubusercontent.com/upmppu-lab/pet4-assets/main';
const hasLocalAssets = fs.existsSync(path.join(assetsDir, 'pets')) || fs.existsSync(path.join(__dirname, 'pets'));

// Helper: Check if request is from local PC development (localhost, 127.0.0.1, LAN)
function isLocalRequest(req) {
  const forwardedHost = req && req.headers && (req.headers['x-forwarded-host'] || '');
  const hostHeader = req && req.headers && (req.headers.host || '');
  const host = String(forwardedHost || hostHeader || (req && req.hostname) || '').toLowerCase().split(':')[0].trim();

  // If host is an AI Studio / Cloud Run preview domain, never consider it local
  if (
    host.endsWith('.run.app') ||
    host.includes('aistudio') ||
    host.includes('googleusercontent.com')
  ) {
    return false;
  }

  // If host is explicitly localhost, loopback, or private local network IP
  if (
    !host ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
  ) {
    return true;
  }

  const ip = String(req && (req.ip || (req.socket && req.socket.remoteAddress) || '')).toLowerCase();
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return true;
  }
  return false;
}

// Determine asset mode based on request context:
// Google AI Studio Preview -> 'remote'
// PC localhost / 127.0.0.1 / any other local environment -> 'local'
// If local asset files are not present on disk, always fallback to 'remote'
function getAssetMode(req) {
  // Explicit override via environment variable if specified
  if (process.env.PET_TOWN_ASSET_MODE === 'remote') return 'remote';
  if (process.env.PET_TOWN_ASSET_MODE === 'local') return 'local';

  // If local image assets are not present in this workspace, must use remote assets
  if (!hasLocalAssets) {
    return 'remote';
  }

  // 1. Google AI Studio Preview domain check
  const forwardedHost = req && req.headers && (req.headers['x-forwarded-host'] || '');
  const hostHeader = req && req.headers && (req.headers.host || '');
  const host = String(forwardedHost || hostHeader || (req && req.hostname) || '').toLowerCase().split(':')[0].trim();

  if (
    host.endsWith('.run.app') ||
    host.includes('aistudio') ||
    host.includes('googleusercontent.com')
  ) {
    return 'remote';
  }

  // 2. Cloud Run environment check
  const isCloudRun = !!(
    process.env.K_SERVICE &&
    (process.env.K_SERVICE.startsWith('ais-dev-') ||
     process.env.K_SERVICE.startsWith('ais-pre-') ||
     process.env.K_SERVICE.includes('aistudio'))
  );
  if (isCloudRun) {
    return 'remote';
  }

  // 3. Any request from localhost / 127.0.0.1 is local
  if (isLocalRequest(req)) {
    return 'local';
  }

  return 'local';
}

app.get('/favicon.ico', (req, res) => res.status(204).end());

// 1. Dynamic asset mode endpoint based on client request
app.get(['/env-config.js', '/assets/env-config.js'], (req, res) => {
  const mode = getAssetMode(req);
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.send(`// Express Server Configuration\nwindow.__PET_TOWN_ASSET_MODE = "${mode}";\n`);
});

// Helper: Serve index.html with appropriate asset mode injected
const serveIndexHtml = (req, res) => {
  const targetFile = fs.existsSync(path.join(assetsDir, 'index.html'))
    ? path.join(assetsDir, 'index.html')
    : path.join(__dirname, 'index.html');
  let html = fs.readFileSync(targetFile, 'utf8');
  const mode = getAssetMode(req);
  if (html.includes('/*__SERVER_ENV_INJECTION__*/')) {
    html = html.replace('/*__SERVER_ENV_INJECTION__*/', `window.__PET_TOWN_ASSET_MODE = "${mode}";`);
  } else {
    html = html.replace(/window\.__PET_TOWN_ASSET_MODE\s*=\s*['"][^'"]*['"];?/g, `window.__PET_TOWN_ASSET_MODE = "${mode}";`);
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
};

// Intercept index.html requests to guarantee injection
app.get(['/', '/index.html', '/assets/index.html'], serveIndexHtml);

// 2. Redirect image asset requests for spr and pets to external GitHub raw repo in remote mode
// or whenever the local asset file does not exist on disk.
app.use((req, res, next) => {
  const p = req.path;
  if (p === '/spr/meta.js' || p === '/assets/spr/meta.js') {
    return next();
  }
  const isSpr = p.startsWith('/spr/') || p.startsWith('/assets/spr/');
  const isPets = p.startsWith('/pets/') || p.startsWith('/assets/pets/');
  if (!isSpr && !isPets) {
    return next();
  }

  // If asset exists locally, serve it locally regardless of mode
  const relPath = p.startsWith('/assets/') ? p.slice(8) : p.slice(1);
  const existsLocally = fs.existsSync(path.join(assetsDir, relPath)) || fs.existsSync(path.join(__dirname, relPath));
  if (existsLocally) {
    return next();
  }

  // Redirect to GitHub raw base with filename normalization for ranch walk sprites
  let targetPath = p.startsWith('/assets/') ? p.slice(7) : p;
  if (targetPath === '/spr/ranch/caw_4.png') targetPath = '/spr/ranch/caw_4_walk1.png';
  if (targetPath === '/spr/ranch/caw_5.png') targetPath = '/spr/ranch/caw_5_walk2.png';
  if (targetPath === '/spr/ranch/pig_4.png') targetPath = '/spr/ranch/pig_4_walk1.png';
  if (targetPath === '/spr/ranch/pig_5.png') targetPath = '/spr/ranch/pig_4_walk2.png';
  if (targetPath.startsWith('/spr/lake/duck_3_')) {
    targetPath = targetPath.replace('/spr/lake/duck_3_', '/spr/lake/duck3_');
  }

  if (p.startsWith('/spr/') || p.startsWith('/pets/')) {
    return res.redirect(302, `${RAW_BASE}${targetPath}`);
  }
  if (p.startsWith('/assets/spr/') || p.startsWith('/assets/pets/')) {
    return res.redirect(302, `${RAW_BASE}${targetPath}`);
  }
  next();
});

// Serve static files from root and assets directory
app.use(express.static(assetsDir));
app.use('/assets', express.static(assetsDir));
app.use(express.static(__dirname));

// Route navigation requests to index.html, 404 for missing static assets
app.get('*', (req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).end();
  }
  serveIndexHtml(req, res);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pet Town server running on http://0.0.0.0:${PORT}`);
});
