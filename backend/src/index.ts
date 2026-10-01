import express from 'express';
import cors from 'cors';
import { config } from './config';
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

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Public Auth Routes
app.use('/api/auth', authRoutes);

// Protected Core CreatorOS API Routes
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/content', authenticate, contentRoutes);
app.use('/api/ideas', authenticate, ideasRoutes);
app.use('/api/opportunities', authenticate, opportunitiesRoutes);
app.use('/api/ai', authenticate, aiRoutes);
app.use('/api/publishing', authenticate, publishingRoutes);
app.use('/api/videos', authenticate, videoLabRoutes);
app.use('/api/thumbnails', authenticate, thumbnailsRoutes);
app.use('/api/audience', authenticate, audienceRoutes);
app.use('/api/trends', authenticate, trendsRoutes);
app.use('/api/autopilot', authenticate, autopilotRoutes);
app.use('/api/brand', authenticate, brandRoutes);
app.use('/api/revenue', authenticate, revenueRoutes);
app.use('/api/team', authenticate, teamRoutes);
app.use('/api/system', authenticate, systemRoutes);

// Dedicated Admin API Routes
app.use('/api/admin', adminRoutes);

// Root Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'CreatorOS Production Backend Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.listen(config.port, () => {
  console.log(`🚀 CreatorOS Backend Running on http://localhost:${config.port}`);
});
