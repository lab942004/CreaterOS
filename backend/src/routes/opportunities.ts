import { Router } from 'express';
import { dbStore, OpportunityData } from '../utils/store';

const router = Router();

// SCREEN 13 — OPPORTUNITY CENTER
router.get('/', (req, res) => {
  res.json({ opportunities: dbStore.opportunities });
});

router.post('/action', (req, res) => {
  const { opportunityId, actionType } = req.body;
  const opp = dbStore.opportunities.find(o => o.id === opportunityId);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  if (actionType === 'create_content') {
    const newContent = {
      id: `cnt_${Date.now()}`,
      workspaceId: 'ws_main_01',
      title: opp.title,
      description: opp.description,
      caption: `Taking immediate advantage of content opportunity: ${opp.title}`,
      type: 'VIDEO',
      platform: opp.platform,
      status: 'DRAFT',
      tags: ['Opportunity', opp.type],
      views: 0,
      likes: 0,
      commentsCount: 0,
      shares: 0,
      engagementRate: 0,
      watchTimeMinutes: 0,
      createdAt: new Date().toISOString()
    };
    dbStore.contents.unshift(newContent);
    return res.json({ success: true, redirect: `/content/${newContent.id}`, content: newContent });
  }

  if (actionType === 'turn_into_idea') {
    const newIdea = {
      id: `idea_${Date.now()}`,
      workspaceId: 'ws_main_01',
      title: opp.title,
      hook: `Why everyone is missing out on ${opp.title}`,
      format: 'VIDEO',
      platform: opp.platform,
      category: 'Opportunity',
      reason: opp.description,
      potentialScore: opp.impactScore,
      cta: 'Subscribe for part 2',
      isFavorite: true,
      isArchived: false,
      createdAt: new Date().toISOString()
    };
    dbStore.ideas.unshift(newIdea);
    return res.json({ success: true, redirect: '/ideas', idea: newIdea });
  }

  res.json({ success: true, message: 'Action executed successfully' });
});

export default router;
