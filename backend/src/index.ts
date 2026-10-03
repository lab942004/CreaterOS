import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { prisma } from './utils/prisma';
import { errorHandler, notFoundHandler } from './utils/errors';
import { apiLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import analyticsRoutes from './routes/analytics';
import contentRoutes from './routes/content';
import ideasRoutes from './routes/ideas';
import opportunitiesRoutes from './routes/opportunities';
import aiRoutes from './routes/ai';
import publishingRoutes from './routes/publishing';
import videoLabRoutes from './routes/videoLab';
import thumbnailsRoutes from './routes/thumbnails';
import audienceRoutes from './routes/audience';
import trendsRoutes from './routes/trends';
import autopilotRoutes from './routes/autopilot';
import brandRoutes from './routes/brand';
import revenueRoutes from './routes/revenue';
import teamRoutes from './routes/teamAndReports';
import systemRoutes from './routes/system';
import adminRoutes from './routes/admin';
import { authenticate } from './middleware/auth';

export const app = express();

// Only the configured frontends may send credentialed cross-origin requests.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Dedicated Admin API Routes (its own auth, mounted before the authenticate guard)
app.use('/api/admin', adminRoutes);

// Healthcheck must stay reachable without auth or rate limiting.
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'CreatorOS Production Backend Engine',
    version: '1.0.0',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// Public Auth Routes
app.use('/api/auth', authRoutes);

// Everything else requires a verified session.
app.use('/api', apiLimiter, authenticate);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/publishing', publishingRoutes);
app.use('/api/videos', videoLabRoutes);
app.use('/api/thumbnails', thumbnailsRoutes);
app.use('/api/audience', audienceRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/autopilot', autopilotRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/system', systemRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  try {
    await prisma.$connect();
    app.listen(config.port, () => {
      console.log(`🚀 CreatorOS Backend Running on http://localhost:${config.port} [${config.env}]`);
    });
  } catch (err) {
    console.error('❌ Failed to start CreatorOS backend:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

export default app;

