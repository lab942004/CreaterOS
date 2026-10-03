/**
 * End-to-end route smoke test.
 *
 * Requires a running API and a seeded database:
 *   npm run migrate:deploy && npm run seed
 *   PORT=5000 npm run dev        # in another shell
 *   npm run smoke                # SMOKE_BASE overrides the target URL
 *
 * Exercises every router the UI depends on, including full CRUD lifecycles,
 * auth failures, workspace isolation and the admin console, then removes the
 * rows it created so the demo data stays re-seedable.
 */
const http = require('http');
const BASE = process.env.SMOKE_BASE || `http://localhost:${process.env.PORT || 5000}`;
const jar = {};

const request = (method, path, body, token) =>
  new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request(
      BASE + path,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(jar.Cookie ? { Cookie: jar.Cookie } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          for (const c of res.headers['set-cookie'] || []) {
            const m = c.match(/^([^=]+)=([^;]*)/);
            if (m) jar.Cookie = [jar.Cookie, `${m[1]}=${m[2]}`].filter(Boolean).join('; ');
          }
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

const login = async (email, password) => {
  const r = await request('POST', '/api/auth/login', { email, password });
  return r.body?.data?.token;
};

const keyList = (data) =>
  Array.isArray(data) ? `array(${data.length})` : Object.keys(data || {}).join(', ');

(async () => {
  const results = [];
  const check = (name, cond, extra) => {
    results.push({ name, ok: !!cond });
    console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? `  :: ${extra}` : ''}`);
  };

  /** 2xx whose body is the standard `{ success, data }` envelope. */
  const isEnvelope = (r) =>
    r.status >= 200 && r.status < 300 && r.body && r.body.success === true && 'data' in r.body;

  /* ── 0. unauthenticated surface ─────────────────────────────── */
  let r = await request('GET', '/api/health');
  check('health (no auth)', r.status === 200 && r.body?.status === 'ONLINE', `status=${r.status}`);

  r = await request('GET', '/api/dashboard');
  check('dashboard rejects anonymous', r.status === 401, `status=${r.status}`);

  r = await request('GET', '/api/content');
  check('content rejects anonymous', r.status === 401, `status=${r.status}`);

  /* ── 1. auth ─────────────────────────────────────────────────── */
  r = await request('POST', '/api/auth/login', {
    email: 'creator@creatoros.ai',
    password: 'CreatorOS@2026',
  });
  const token = r.body?.data?.token;
  check('demo creator login', r.status === 200 && !!token, `status=${r.status}`);
  if (!token) {
    console.log(JSON.stringify(r.body).slice(0, 600));
    process.exit(1);
  }
  check('login returns workspace', !!r.body?.data?.workspace?.id);
  check('login sets refresh cookie', !!jar.Cookie, jar.Cookie || 'none');

  const auth = (m, p, b) => request(m, p, b, token);

  r = await auth('GET', '/api/auth/me');
  check('GET /auth/me', isEnvelope(r) && r.body.data.user.email === 'creator@creatoros.ai', `status=${r.status}`);

  r = await auth('GET', '/api/auth/sessions');
  check('GET /auth/sessions', isEnvelope(r), `status=${r.status}`);

  r = await request('POST', '/api/auth/login', { email: 'not-an-email', password: 'x' });
  check('login validation envelope', r.status === 422 && r.body?.success === false, `status=${r.status}`);

  r = await request('POST', '/api/auth/login', {
    email: 'creator@creatoros.ai',
    password: 'WrongPassword!123',
  });
  check('login rejects bad password', r.status === 401 && r.body?.success === false, `status=${r.status}`);

  r = await request('POST', '/api/auth/refresh');
  check('refresh rotates access token', r.status === 200 && !!r.body?.data?.token, `status=${r.status}`);

  /* ── 2. read endpoints the UI depends on ─────────────────────── */
  const reads = [
    ['/api/dashboard', ['metrics', 'topPerforming', 'recentContent', 'upcomingContent', 'socialAccounts', 'opportunities', 'aiRecommendations']],
    ['/api/analytics/overview?timeframe=30d', ['timeframe', 'totals', 'growthSeries', 'contentPerformance']],
    ['/api/analytics/platforms', ['platforms']],
    ['/api/content', ['contents']],
    ['/api/content?platform=YOUTUBE&type=VIDEO&status=PUBLISHED', ['contents']],
    ['/api/content?search=local', ['contents']],
    ['/api/ideas', ['ideas']],
    ['/api/opportunities', ['opportunities']],
    ['/api/publishing/calendar', ['events']],
    ['/api/publishing/smart-scheduler', ['recommendations']],
    ['/api/publishing/queue', ['queue']],
    ['/api/videos', ['videos']],
    ['/api/thumbnails', ['thumbnails']],
    ['/api/audience', ['totalAudience', 'growthRate', 'engagementRate', 'demographics', 'aiInsights']],
    ['/api/audience/questions', ['questions']],
    ['/api/audience/comments', ['comments']],
    ['/api/trends/trends', ['trends']],
    ['/api/trends/benchmark', ['benchmarks']],
    ['/api/autopilot', ['metrics', 'automations', 'recentRuns']],
    ['/api/autopilot/logs', ['logs']],
    ['/api/brand/brain', ['brain']],
    ['/api/brand/memory', ['memories']],
    ['/api/brand/kit', ['brandKit']],
    ['/api/brand/preview', ['brandKit', 'mockPostPreview']],
    ['/api/revenue', ['breakdown', 'history']],
    ['/api/revenue/deals', ['deals']],
    ['/api/revenue/campaigns', ['campaigns']],
    ['/api/team/team', ['members', 'tasks']],
    ['/api/team/reports', ['reports']],
    ['/api/system/notifications', ['notifications']],
    ['/api/system/settings', ['user', 'workspace', 'aiSettings']],
    ['/api/system/billing', ['currentPlan', 'price', 'billingCycle', 'usage', 'invoices']],
    ['/api/system/security', ['twoFactorEnabled', 'activeSessions']],
    ['/api/system/search?q=creator', ['content', 'ideas', 'videos', 'questions']],
  ];

  for (const [path, keys] of reads) {
    const rr = await auth('GET', path);
    const missing = isEnvelope(rr) ? keys.filter((k) => !(k in (rr.body.data || {}))) : keys;
    check(
      `GET ${path}`,
      isEnvelope(rr) && missing.length === 0,
      `status=${rr.status}${missing.length ? ` missing=[${missing.join(',')}]` : ''}`
    );
  }

  /* ── 3. AI surfaces ──────────────────────────────────────────── */
  r = await auth('POST', '/api/ai/strategist', { messages: [{ role: 'user', content: 'hello' }] });
  check('POST /ai/strategist', isEnvelope(r) && !!r.body.data.reply, `status=${r.status}`);

  r = await auth('POST', '/api/ai/my-content', { question: 'what performed best?' });
  check('POST /ai/my-content', isEnvelope(r) && !!r.body.data.reply, `status=${r.status}`);

  r = await auth('POST', '/api/ai/command', { command: 'show analytics' });
  check('POST /ai/command', isEnvelope(r) && !!r.body.data.result?.type, `status=${r.status}`);

  r = await auth('POST', '/api/ai/generate-content', { topic: 'AI tooling', platform: 'YOUTUBE', tone: 'Direct' });
  check('POST /ai/generate-content', isEnvelope(r) && !!r.body.data.generatedText, `status=${r.status}`);

  r = await auth('GET', '/api/ai/status');
  check(
    'GET /ai/status',
    isEnvelope(r) &&
      typeof r.body.data.provider === 'string' &&
      typeof r.body.data.isMock === 'boolean' &&
      typeof r.body.data.credentialsPresent === 'object',
    `provider=${r.body?.data?.provider} mock=${r.body?.data?.isMock}`
  );

  r = await auth('POST', '/api/ai/generate-script', {
    topic: 'creator economy',
    platform: 'YOUTUBE',
    length: '60 seconds',
  });
  check(
    'POST /ai/generate-script',
    isEnvelope(r) && Array.isArray(r.body.data.script?.scenes) && r.body.data.script.scenes.length > 0,
    `status=${r.status} scenes=${r.body?.data?.script?.scenes?.length}`
  );

  /* ── 4. content lifecycle ────────────────────────────────────── */
  r = await auth('POST', '/api/content', {
    title: 'Smoke Test Asset',
    description: 'created by the route smoke test',
    type: 'VIDEO',
    platform: 'YOUTUBE',
    status: 'DRAFT',
    tags: ['smoke', 'test'],
  });
  const contentId = r.body?.data?.content?.id;
  check('POST /content', r.status === 201 && !!contentId, `status=${r.status}`);

  if (contentId) {
    r = await auth('GET', `/api/content/${contentId}`);
    check('GET /content/:id', isEnvelope(r) && r.body.data.content.id === contentId, `status=${r.status}`);

    r = await auth('GET', `/api/content/${contentId}/dna`);
    check('GET /content/:id/dna', isEnvelope(r) && !!r.body.data.dna?.id, `status=${r.status}`);

    r = await auth('PUT', `/api/content/${contentId}`, { title: 'Smoke Test Asset (edited)', status: 'PUBLISHED' });
    check(
      'PUT /content/:id',
      isEnvelope(r) && r.body.data.content.title === 'Smoke Test Asset (edited)',
      `status=${r.status}`
    );

    r = await auth('DELETE', `/api/content/${contentId}`);
    check('DELETE /content/:id', isEnvelope(r), `status=${r.status}`);

    r = await auth('GET', `/api/content/${contentId}`);
    check('deleted content is gone', r.status === 404, `status=${r.status}`);
  }

  /* ── 5. idea lifecycle ───────────────────────────────────────── */
  r = await auth('POST', '/api/ideas/generate', { topic: 'AI workflows', niche: 'tech', platform: 'YOUTUBE' });
  const ideaId = r.body?.data?.ideas?.[0]?.id;
  check('POST /ideas/generate', isEnvelope(r) && !!ideaId, `status=${r.status}`);

  if (ideaId) {
    r = await auth('POST', `/api/ideas/${ideaId}/favorite`);
    check('POST /ideas/:id/favorite', isEnvelope(r), `status=${r.status}`);

    r = await auth('POST', `/api/ideas/${ideaId}/convert-content`, { type: 'VIDEO' });
    check('POST /ideas/:id/convert-content', isEnvelope(r) && !!r.body.data.content?.id, `status=${r.status}`);

    r = await auth('POST', `/api/ideas/${ideaId}/convert-script`);
    check('POST /ideas/:id/convert-script', isEnvelope(r), `status=${r.status}`);

    r = await auth('DELETE', `/api/ideas/${ideaId}`);
    check('DELETE /ideas/:id', isEnvelope(r), `status=${r.status}`);
  }

  /* ── 6. team tasks + reports ─────────────────────────────────── */
  r = await auth('POST', '/api/team/team/tasks', { title: 'Smoke test task', priority: 'HIGH' });
  const taskId = r.body?.data?.task?.id;
  check('POST /team/team/tasks', r.status === 201 && !!taskId, `status=${r.status}`);

  if (taskId) {
    r = await auth('PUT', `/api/team/team/tasks/${taskId}`, { status: 'DONE' });
    check('PUT /team/team/tasks/:id', isEnvelope(r) && r.body.data.task.status === 'DONE', `status=${r.status}`);
  }

  r = await auth('POST', '/api/team/reports/generate', { title: 'Smoke report', type: 'analytics' });
  const reportId = r.body?.data?.report?.id;
  check('POST /team/reports/generate', r.status === 201 && !!reportId, `status=${r.status}`);
  if (reportId) {
    r = await auth('GET', `/api/team/reports/${reportId}`);
    check('GET /team/reports/:id', isEnvelope(r), `status=${r.status}`);
  }

  /* ── 7. revenue CRM ──────────────────────────────────────────── */
  r = await auth('POST', '/api/revenue/deals', {
    brandName: 'Smoke Brand',
    dealValue: 2500,
    contactPerson: 'Dana Reed',
    contactEmail: 'dana@smokebrand.test',
    stage: 'PITCHED',
    paymentStatus: 'PENDING',
  });
  const dealId = r.body?.data?.deal?.id;
  check('POST /revenue/deals', r.status === 201 && !!dealId, `status=${r.status}`);
  if (dealId) {
    r = await auth('PUT', `/api/revenue/deals/${dealId}`, { stage: 'NEGOTIATING' });
    check(
      'PUT /revenue/deals/:id',
      isEnvelope(r) && r.body.data.deal.stage === 'NEGOTIATING',
      `status=${r.status}`
    );
  }

  r = await auth('POST', '/api/revenue/campaigns', { title: 'Smoke Campaign', brandName: 'Smoke Brand', budget: 500 });
  check('POST /revenue/campaigns', r.status === 201, `status=${r.status}`);

  /* ── 8. brand brain + memory ─────────────────────────────────── */
  r = await auth('PUT', '/api/brand/brain', { tone: ['Direct', 'Witty'], pillars: ['Systems'] });
  check('PUT /brand/brain', isEnvelope(r), `status=${r.status}`);

  r = await auth('POST', '/api/brand/memory', { key: 'hook-style', value: 'Prefer short hooks.', category: 'HOOKS' });
  const memoryId = r.body?.data?.memory?.id;
  check('POST /brand/memory', r.status === 201 && !!memoryId, `status=${r.status}`);
  if (memoryId) {
    r = await auth('DELETE', `/api/brand/memory/${memoryId}`);
    check('DELETE /brand/memory/:id', isEnvelope(r), `status=${r.status}`);
  }

  /* ── 9. video lab + thumbnail ────────────────────────────────── */
  r = await auth('POST', '/api/videos/upload', { title: 'Smoke Upload', filename: 'smoke.mp4' });
  const videoId = r.body?.data?.video?.id;
  check('POST /videos/upload', r.status === 201 && !!videoId, `status=${r.status}`);

  if (videoId) {
    r = await auth('GET', `/api/videos/${videoId}`);
    check('GET /videos/:id', isEnvelope(r), `status=${r.status}`);

    r = await auth('PUT', `/api/videos/${videoId}/transcript`, { text: 'Smoke transcript.' });
    check('PUT /videos/:id/transcript', isEnvelope(r), `status=${r.status}`);

    r = await auth('GET', `/api/videos/${videoId}/transcript`);
    check('GET /videos/:id/transcript', isEnvelope(r), `status=${r.status}`);

    r = await auth('POST', `/api/videos/${videoId}/clips/generate`);
    check('POST /videos/:id/clips/generate', isEnvelope(r) && !!r.body.data.clip?.id, `status=${r.status}`);

    r = await auth('GET', `/api/videos/${videoId}/clips`);
    check('GET /videos/:id/clips', isEnvelope(r), `status=${r.status}`);

    // Regression guard: the UI offers LinkedIn/ARTICLE and Instagram/CAROUSEL
    // targets, and both must survive the round trip unchanged.
    for (const [platform, format] of [
      ['TIKTOK', 'SHORT'],
      ['LINKEDIN', 'ARTICLE'],
      ['INSTAGRAM', 'CAROUSEL'],
    ]) {
      r = await auth('POST', `/api/videos/${videoId}/repurpose`, { targetPlatform: platform, targetFormat: format });
      const c = r.body?.data?.content;
      check(
        `POST /videos/:id/repurpose ${platform}/${format}`,
        isEnvelope(r) && c?.platform === platform && c?.type === format,
        `status=${r.status} got=${c?.platform}/${c?.type}`
      );
    }
  }

  r = await auth('POST', '/api/thumbnails/generate', { title: 'Smoke Thumb', platform: 'YOUTUBE' });
  const thumbId = r.body?.data?.thumbnail?.id;
  check('POST /thumbnails/generate', r.status === 201 && !!thumbId, `status=${r.status}`);
  if (thumbId) {
    r = await auth('DELETE', `/api/thumbnails/${thumbId}`);
    check('DELETE /thumbnails/:id', isEnvelope(r), `status=${r.status}`);
  }

  /* ── 10. autopilot + publishing ──────────────────────────────── */
  r = await auth('POST', '/api/autopilot/rules', {
    name: 'Smoke rule',
    description: 'Created by the route smoke test',
    trigger: 'NEW_VIDEO_PUBLISHED',
    conditions: [],
    actions: [{ type: 'CROSS_POST' }],
  });
  const ruleId = r.body?.data?.automation?.id;
  check('POST /autopilot/rules', r.status === 201 && !!ruleId, `status=${r.status}`);
  if (ruleId) {
    r = await auth('POST', `/api/autopilot/${ruleId}/toggle`);
    check('POST /autopilot/:id/toggle', isEnvelope(r), `status=${r.status}`);
  }

  const firstContent = (await auth('GET', '/api/content')).body?.data?.contents?.[0];
  if (firstContent) {
    r = await auth('POST', '/api/publishing/calendar/reschedule', {
      contentId: firstContent.id,
      newDate: new Date(Date.now() + 5 * 86400_000).toISOString(),
    });
    check('POST /publishing/calendar/reschedule', isEnvelope(r), `status=${r.status}`);
  } else {
    check('POST /publishing/calendar/reschedule', false, 'no seeded content to reschedule');
  }

  r = await auth('POST', '/api/publishing/compose', {
    title: 'Smoke scheduled post',
    caption: 'Written by the route smoke test.',
    platform: 'INSTAGRAM',
    type: 'POST',
    scheduleTime: new Date(Date.now() + 3 * 86400_000).toISOString(),
  });
  check('POST /publishing/compose', r.status === 201, `status=${r.status}`);

  /* ── 11. audience engagement ─────────────────────────────────── */
  const comment = (await auth('GET', '/api/audience/comments')).body?.data?.comments?.[0];
  if (comment) {
    r = await auth('POST', `/api/audience/comments/${comment.id}/reply`, { replyText: 'Smoke reply' });
    check('POST /audience/comments/:id/reply', isEnvelope(r), `status=${r.status}`);
  } else {
    check('POST /audience/comments/:id/reply', false, 'no seeded comment');
  }

  const question = (await auth('GET', '/api/audience/questions')).body?.data?.questions?.[0];
  if (question) {
    r = await auth('POST', `/api/audience/questions/${question.id}/turn-idea`);
    check('POST /audience/questions/:id/turn-idea', isEnvelope(r), `status=${r.status}`);
  } else {
    check('POST /audience/questions/:id/turn-idea', false, 'no seeded question');
  }

  /* ── 12. system writes ───────────────────────────────────────── */
  r = await auth('PUT', '/api/system/settings/account', { name: 'Demo Creator' });
  check('PUT /system/settings/account', isEnvelope(r), `status=${r.status}`);

  r = await auth('PUT', '/api/system/settings/ai', { model: 'gpt-4o-mini' });
  check('PUT /system/settings/ai', isEnvelope(r), `status=${r.status}`);

  r = await auth('POST', '/api/system/notifications/mark-all-read');
  check('POST /system/notifications/mark-all-read', isEnvelope(r), `status=${r.status}`);

  /* ── 13. error handling / isolation ──────────────────────────── */
  r = await auth('GET', '/api/content/does-not-exist');
  check('unknown content id → 404', r.status === 404 && r.body?.success === false, `status=${r.status}`);

  r = await auth('PUT', '/api/content/does-not-exist', { title: 'nope' });
  check('PUT unknown content id → 404', r.status === 404, `status=${r.status}`);

  r = await auth('GET', '/api/no-such-router');
  check('unknown route → 404', r.status === 404 && r.body?.success === false, `status=${r.status}`);

  r = await auth('POST', '/api/ai/strategist', {});
  check('AI rejects missing messages', r.status >= 400 && r.body?.success === false, `status=${r.status}`);

  r = await auth('POST', '/api/audience/comments/does-not-exist/reply', { replyText: 'hi' });
  check('reply to unknown comment → 404', r.status === 404, `status=${r.status}`);

  /* ── 14. admin console ───────────────────────────────────────── */
  r = await request('POST', '/api/admin/login', {
    email: 'admin@creatoros.ai',
    password: 'CreatorOS@2026',
  });
  const adminToken = r.body?.data?.token;
  check('admin login', r.status === 200 && !!adminToken, `status=${r.status}`);

  r = await request('POST', '/api/admin/login', {
    email: 'admin@creatoros.ai',
    password: 'WrongPassword!123',
  });
  check('admin rejects bad password', r.status === 401, `status=${r.status}`);

  if (adminToken) {
    const asAdmin = (m, p, b) => request(m, p, b, adminToken);
    for (const p of [
      '/api/admin/dashboard',
      '/api/admin/users',
      '/api/admin/workspaces',
      '/api/admin/health',
      '/api/admin/jobs',
      '/api/admin/ai-usage',
      '/api/admin/storage',
      '/api/admin/feature-flags',
      '/api/admin/audit-logs',
    ]) {
      const rr = await asAdmin('GET', p);
      check(`GET ${p}`, isEnvelope(rr), `status=${rr.status}`);
    }
  }

  r = await request('GET', '/api/admin/dashboard');
  check('admin rejects anonymous', r.status === 401, `status=${r.status}`);

  r = await request('GET', '/api/admin/users', undefined, token);
  check('creator token rejected by admin', r.status === 401 || r.status === 403, `status=${r.status}`);

  /* ── 15. cleanup ─────────────────────────────────────────────── */
  // The suite writes into the demo workspace, so remove what it created to keep
  // the demo data re-seedable. Must run before logout while the token is live.
  const isSmoke = (s) => typeof s === 'string' && /smoke/i.test(s);
  const byTitle = (row) => isSmoke(row.title) || isSmoke(row.brandName) || isSmoke(row.name);

  const wipe = async (label, listPath, listKey, delPath) => {
    const list = (await auth('GET', listPath)).body?.data?.[listKey];
    if (!Array.isArray(list)) return;
    let n = 0;
    for (const row of list) {
      if (row.id && byTitle(row)) {
        await auth('DELETE', delPath(row.id));
        n++;
      }
    }
    if (n) console.log(`      cleanup ${label}: removed ${n}`);
  };

  await wipe('content', '/api/content', 'contents', (id) => `/api/content/${id}`);
  await wipe('ideas', '/api/ideas', 'ideas', (id) => `/api/ideas/${id}`);
  await wipe('thumbnails', '/api/thumbnails', 'thumbnails', (id) => `/api/thumbnails/${id}`);
  await wipe('memories', '/api/brand/memory', 'memories', (id) => `/api/brand/memory/${id}`);

  // Videos, deals, campaigns, reports and automations have no delete endpoint,
  // so those smoke rows persist by design; `npm run seed` is the reset path.

  /* ── 16. logout ──────────────────────────────────────────────── */
  r = await auth('POST', '/api/auth/logout');
  check('POST /auth/logout', isEnvelope(r), `status=${r.status}`);

  // Access tokens are short-lived (15m) and stateless by design, so logout
  // revokes the refresh token rather than the in-flight access token.
  r = await request('POST', '/api/auth/refresh');
  check('refresh token revoked by logout', r.status === 401, `status=${r.status}`);

  r = await auth('POST', '/api/auth/refresh');
  check('refresh stays revoked on replay', r.status === 401, `status=${r.status}`);

  const lifetime = token.split('.')[1] ? JSON.parse(Buffer.from(token.split('.')[1], 'base64url')) : {};
  const mins = Math.round((lifetime.exp - lifetime.iat) / 60);
  check('access token lifetime is short', mins > 0 && mins <= 30, `${mins} minutes`);

  const failed = results.filter((x) => !x.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('failing:');
    for (const f of failed) console.log(`  - ${f.name}`);
  }
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('smoke crashed:', e);
  process.exit(1);
});




