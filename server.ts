import 'dotenv/config';
import crypto from 'crypto';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '5mb' }));

// Persistent real-time catalog store + SSE subscribers
const DATA_DIR = path.resolve(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SEED_PRODUCTS_FILE = path.resolve(
  __dirname,
  'src/data/initialProducts.json'
);

interface ServerProduct {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  priceETB: number;
  priceUSD: number;
  fabricType: string;
  availableFabrics: string[];
  tibebColors: Array<{ name: string; swatchHex: string; accentHex: string }>;
  weavingTime: string;
  stockStatus: string;
  images: string[];
  description: string;
  artisanNote: string;
  featured?: boolean;
  upsellIds?: string[];
  isOneSizeOnly?: boolean;
}

function loadProductsStore(): ServerProduct[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as ServerProduct[];
      }
    }
  } catch (err) {
    console.warn('Could not read data/products.json, falling back to seed:', err);
  }

  try {
    const seed = JSON.parse(
      fs.readFileSync(SEED_PRODUCTS_FILE, 'utf8')
    ) as ServerProduct[];
    saveProductsStore(seed);
    return seed;
  } catch {
    return [];
  }
}

function saveProductsStore(products: ServerProduct[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (err) {
    console.warn('Unable to write data/products.json to disk (kept in memory):', err);
  }
}

let liveProducts: ServerProduct[] = loadProductsStore();
const productSseClients = new Set<Response>();

function broadcastProductsSync(): void {
  const payload = `data: ${JSON.stringify({ type: 'sync', products: liveProducts })}\n\n`;
  for (const client of productSseClients) {
    try {
      client.write(payload);
    } catch {
      productSseClients.delete(client);
    }
  }
}

const ADMIN_COOKIE_NAME = 'etc_admin_session';
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET?.trim() ||
  crypto.randomBytes(32).toString('hex');

const failedLoginAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function constantTimeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function signAdminToken(expiresAt: number): string {
  const payload = Buffer.from(
    JSON.stringify({ role: 'owner', exp: expiresAt })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function verifyAdminToken(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  if (!constantTimeCompare(signature, expectedSig)) return false;

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as { role?: string; exp?: number };
    if (decoded.role !== 'owner' || !decoded.exp) return false;
    return Date.now() < decoded.exp;
  } catch {
    return false;
  }
}

function extractCookieToken(req: Request): string | undefined {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return undefined;
  const pairs = rawCookie.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key === ADMIN_COOKIE_NAME) {
      return decodeURIComponent(val);
    }
  }
  return undefined;
}

function isAdminAuthenticated(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (verifyAdminToken(bearer)) return true;
  }
  const cookieToken = extractCookieToken(req);
  return verifyAdminToken(cookieToken);
}

function getGeminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface AnalyzeOrderItemInput {
  name: string;
  category: string;
  quantity: number;
  priceETB: number;
  priceUSD: number;
  sizingMode: string;
  selectedFabric: string;
  selectedTibebColor: string;
}

interface AnalyzeOrderInput {
  id: string;
  status: string;
  cityCountry: string;
  totalETB: number;
  totalUSD: number;
  items: AnalyzeOrderItemInput[];
}

interface AnalyzeProductInput {
  name: string;
  category: string;
  subCategory: string;
  fabricType: string;
  stockStatus: string;
  weavingTime: string;
  priceETB: number;
  priceUSD: number;
}

interface AnalyzeInquiryInput {
  occasion: string;
  preferredColors: string;
  message: string;
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    store: 'Ethiopian Traditional Cloth',
    address: 'Shiromieda, Addis Ababa, Ethiopia',
    mobile: '0941884443',
  });
});

app.get('/api/admin/session', (req, res) => {
  const configured = Boolean(process.env.ADMIN_ACCESS_KEY?.trim());
  const authenticated = configured && isAdminAuthenticated(req);
  res.json({ authenticated, configured });
});

app.post('/api/admin/login', (req, res) => {
  const expectedKey = process.env.ADMIN_ACCESS_KEY?.trim();
  if (!expectedKey) {
    return res.status(503).json({
      configured: false,
      error:
        'Admin portal is locked because ADMIN_ACCESS_KEY is not configured in server secrets yet.',
    });
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const attempt = failedLoginAttempts.get(ip);
  if (attempt && attempt.resetAt > now && attempt.count >= 5) {
    return res.status(429).json({
      error: 'Too many failed attempts. Please wait 15 minutes before retrying.',
    });
  }

  const submittedKey =
    typeof req.body?.accessKey === 'string' ? req.body.accessKey.trim() : '';

  if (!submittedKey || !constantTimeCompare(submittedKey, expectedKey)) {
    const nextCount = attempt && attempt.resetAt > now ? attempt.count + 1 : 1;
    failedLoginAttempts.set(ip, {
      count: nextCount,
      resetAt: now + 15 * 60 * 1000,
    });
    return res.status(401).json({
      error: 'Invalid admin access key.',
    });
  }

  failedLoginAttempts.delete(ip);
  const expiresAt = now + ADMIN_SESSION_TTL_MS;
  const token = signAdminToken(expiresAt);

  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ADMIN_SESSION_TTL_MS,
    path: '/',
  });

  return res.json({
    authenticated: true,
    token,
    expiresAt,
  });
});

app.post('/api/admin/logout', (_req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// Public read + real-time SSE stream for live storefront catalog
app.get('/api/products', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ products: liveProducts });
});

app.get('/api/products/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(
    `data: ${JSON.stringify({ type: 'sync', products: liveProducts })}\n\n`
  );
  productSseClients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      productSseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    productSseClients.delete(res);
  });
});

// Owner-protected real-time catalog management routes
app.post('/api/products', (req, res) => {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({
      error: 'Owner login required to publish new products.',
    });
  }

  const incoming = req.body as Partial<ServerProduct> | undefined;
  const name = typeof incoming?.name === 'string' ? incoming.name.trim() : '';
  if (!name) {
    return res.status(400).json({ error: 'Product name is required.' });
  }

  const priceETB = Math.max(0, Number(incoming?.priceETB) || 0);
  const priceUSD = Math.max(0, Number(incoming?.priceUSD) || 0);

  const created: ServerProduct = {
    id:
      typeof incoming?.id === 'string' && incoming.id.trim()
        ? incoming.id.trim()
        : `etc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    category: incoming?.category || 'Women',
    subCategory:
      typeof incoming?.subCategory === 'string' && incoming.subCategory.trim()
        ? incoming.subCategory.trim()
        : incoming?.category || 'Habesha Kemis',
    priceETB,
    priceUSD,
    fabricType: incoming?.fabricType || 'Hand-Spun Cotton (Menen)',
    availableFabrics:
      Array.isArray(incoming?.availableFabrics) && incoming.availableFabrics.length > 0
        ? incoming.availableFabrics
        : [incoming?.fabricType || 'Hand-Spun Cotton (Menen)'],
    tibebColors:
      Array.isArray(incoming?.tibebColors) && incoming.tibebColors.length > 0
        ? incoming.tibebColors
        : [
            {
              name: 'Burnished Gold & Obsidian',
              swatchHex: '#C59B27',
              accentHex: '#1A1817',
            },
          ],
    weavingTime:
      typeof incoming?.weavingTime === 'string' && incoming.weavingTime.trim()
        ? incoming.weavingTime.trim()
        : '10–14 Days',
    stockStatus: incoming?.stockStatus || 'Made to Order',
    images:
      Array.isArray(incoming?.images) && incoming.images.length > 0
        ? incoming.images
        : ['/src/assets/images/women_kemis_gold_1795027915246.jpg'],
    description:
      typeof incoming?.description === 'string' && incoming.description.trim()
        ? incoming.description.trim()
        : 'Hand-woven Ethiopian luxury garment crafted in our Shiromieda atelier.',
    artisanNote:
      typeof incoming?.artisanNote === 'string' && incoming.artisanNote.trim()
        ? incoming.artisanNote.trim()
        : 'Crafted by Ethiopian Traditional Cloth, Shiromieda.',
    featured: incoming?.featured ?? true,
    upsellIds: Array.isArray(incoming?.upsellIds)
      ? incoming.upsellIds
      : ['hc-netela-03', 'hc-jewelry-10'],
    isOneSizeOnly: Boolean(incoming?.isOneSizeOnly),
  };

  liveProducts = [created, ...liveProducts];
  saveProductsStore(liveProducts);
  broadcastProductsSync();

  return res.status(201).json({ product: created, products: liveProducts });
});

app.put('/api/products/:id', (req, res) => {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({
      error: 'Owner login required to update products.',
    });
  }

  const targetId = req.params.id;
  const idx = liveProducts.findIndex((p) => p.id === targetId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const incoming = req.body as Partial<ServerProduct> | undefined;
  const existing = liveProducts[idx];
  const updated: ServerProduct = {
    ...existing,
    ...incoming,
    id: existing.id,
    name:
      typeof incoming?.name === 'string' && incoming.name.trim()
        ? incoming.name.trim()
        : existing.name,
    priceETB:
      incoming?.priceETB !== undefined
        ? Math.max(0, Number(incoming.priceETB) || 0)
        : existing.priceETB,
    priceUSD:
      incoming?.priceUSD !== undefined
        ? Math.max(0, Number(incoming.priceUSD) || 0)
        : existing.priceUSD,
  };

  liveProducts = liveProducts.map((p) => (p.id === targetId ? updated : p));
  saveProductsStore(liveProducts);
  broadcastProductsSync();

  return res.json({ product: updated, products: liveProducts });
});

app.delete('/api/products/:id', (req, res) => {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({
      error: 'Owner login required to delete products.',
    });
  }

  const targetId = req.params.id;
  const next = liveProducts.filter((p) => p.id !== targetId);
  if (next.length === liveProducts.length) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  liveProducts = next;
  saveProductsStore(liveProducts);
  broadcastProductsSync();

  return res.json({ products: liveProducts });
});

app.post('/api/trends/analyze', async (req, res) => {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({
      error: 'Owner authentication is required to access Atelier Trend Analysis.',
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error:
        'Gemini API key is not configured. Please verify GEMINI_API_KEY in Settings > Secrets.',
    });
  }

  try {
    const ai = getGeminiClient();
    const {
      orders = [],
      products = [],
      inquiries = [],
    } = (req.body || {}) as {
      orders?: AnalyzeOrderInput[];
      products?: AnalyzeProductInput[];
      inquiries?: AnalyzeInquiryInput[];
    };

    const salesLineItems = orders.flatMap((order) =>
      (order.items || []).map((item) => ({
        orderId: order.id,
        destination: order.cityCountry,
        status: order.status,
        garment: item.name,
        category: item.category,
        quantity: item.quantity,
        revenueUSD: item.priceUSD * item.quantity,
        sizingMode: item.sizingMode,
        fabric: item.selectedFabric,
        tibebColor: item.selectedTibebColor,
      }))
    );

    const promptPayload = {
      totalOrders: orders.length,
      salesLineItems,
      catalogOverview: products.map((p) => ({
        name: p.name,
        category: p.category,
        subCategory: p.subCategory,
        fabricType: p.fabricType,
        stockStatus: p.stockStatus,
        weavingTime: p.weavingTime,
        priceUSD: p.priceUSD,
      })),
      bespokeInquiries: inquiries.map((inq) => ({
        occasion: inq.occasion,
        preferredColors: inq.preferredColors,
        summary: inq.message,
      })),
    };

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Analyze the following Ethiopian Traditional Cloth (Ethiopian luxury traditional fashion house in Shiromieda, Addis Ababa, Ethiopia) sales orders, catalog inventory, and customer bespoke inquiries. Identify which hand-weaving patterns, garment silhouettes, fabrics (Menen, Silk-Blend Shemma, Heavy Gabi, Velvet Kaba), and Tibeb color combinations are gaining momentum. Provide grounded, specific recommendations for the Shiromieda weavers and atelier tailors.\n\nData:\n${JSON.stringify(promptPayload, null, 2)}`,
      config: {
        systemInstruction:
          'You are the Head Textile & Couture Trend Strategist for Ethiopian Traditional Cloth in Shiromieda, Addis Ababa, Ethiopia. Ground every trend insight strictly in the provided sales orders, fabrics, Tibeb color selections, and bespoke inquiries. Keep prose refined, concise, and domain-authentic without hype.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description:
                '2-3 sentence executive summary citing the actual orders, fabrics, and buyer destinations observed.',
            },
            risingWeavingPatterns: {
              type: Type.ARRAY,
              description: 'Exactly 3 weaving pattern & silhouette trends.',
              items: {
                type: Type.OBJECT,
                properties: {
                  patternName: {
                    type: Type.STRING,
                    description:
                      'Authentic Ethiopian weaving or garment style name (e.g., Silk-Blend Zuria with Double-Width Tibeb).',
                  },
                  fabricPairing: {
                    type: Type.STRING,
                    description:
                      'Recommended loom textile (e.g., Silk-Blend Shemma or Hand-Spun Cotton Menen).',
                  },
                  demandSignal: {
                    type: Type.STRING,
                    description:
                      'Concrete reason grounded in the order or inquiry data.',
                  },
                  momentumLabel: {
                    type: Type.STRING,
                    description: 'Short label like High Demand, Rising, or Emerging.',
                  },
                  loomRecommendation: {
                    type: Type.STRING,
                    description:
                      'Suggested action for weavers (e.g., pre-loom batch size or lead time adjustment).',
                  },
                },
                required: [
                  'patternName',
                  'fabricPairing',
                  'demandSignal',
                  'momentumLabel',
                  'loomRecommendation',
                ],
              },
            },
            trendingColorCombinations: {
              type: Type.ARRAY,
              description: 'Exactly 3 Tibeb color combinations gaining popularity.',
              items: {
                type: Type.OBJECT,
                properties: {
                  paletteName: {
                    type: Type.STRING,
                    description:
                      'Name of the Tibeb border & base color pairing.',
                  },
                  primaryColorHex: {
                    type: Type.STRING,
                    description: 'Hex color code for the primary thread (e.g., #C59B27).',
                  },
                  accentColorHex: {
                    type: Type.STRING,
                    description: 'Hex color code for the secondary thread (e.g., #164A3B).',
                  },
                  targetOccasion: {
                    type: Type.STRING,
                    description: 'Primary occasion such as Mels Ceremonies, Timket, or Formal Galas.',
                  },
                  rationale: {
                    type: Type.STRING,
                    description: 'Short rationale tied to recent customer orders and inquiries.',
                  },
                },
                required: [
                  'paletteName',
                  'primaryColorHex',
                  'accentColorHex',
                  'targetOccasion',
                  'rationale',
                ],
              },
            },
            atelierActionPlan: {
              type: Type.ARRAY,
              description: '3 concise operational actions for production and merchandising.',
              items: {
                type: Type.STRING,
              },
            },
          },
          required: [
            'executiveSummary',
            'risingWeavingPatterns',
            'trendingColorCombinations',
            'atelierActionPlan',
          ],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);

    return res.json({
      ...parsed,
      generatedAt: new Date().toISOString(),
      model: 'gemini-4-hydrogen',
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to analyze style trends.';
    console.error('Gemini trend analysis error:', err);

    if (
      message.includes('API_KEY_INVALID') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('403')
    ) {
      return res.status(403).json({
        error:
          'API key authorization failed. Please check your Gemini API key in Settings > Secrets.',
      });
    }
    if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
      return res.status(429).json({
        error:
          'Gemini API rate limit reached. Please wait a moment and try again.',
      });
    }

    return res.status(500).json({ error: message });
  }
});

async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.get('/robots.txt', (req, res) => {
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml\n`
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = (
      process.env.APP_URL || `${req.protocol}://${req.get('host')}`
    ).replace(/\/$/, '');
    const today = new Date().toISOString().split('T')[0];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Ethiopian Traditional Cloth server running on http://0.0.0.0:${port}`);
  });
}

startServer();
