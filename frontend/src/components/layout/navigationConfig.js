import {
  LayoutDashboard, BarChart3, Layers, Lightbulb, Sparkles, Calendar,
  PenTool, Video, Image as ImageIcon, Users, MessageSquare, TrendingUp,
  Target, Clock, Send, Cpu, Brain, Database, Palette, DollarSign,
  Handshake, Megaphone, UserPlus, FileText, Bell, Settings, ShieldCheck,
  Bot, Command, Compass, Gauge, Wallet, LineChart,
} from 'lucide-react';

/**
 * Navigation information architecture.
 *
 * Five top-level groups (Overview / Content / Audience / Business / System).
 * Items with sibling views expose them as `children`, which keeps the primary
 * rail short while preserving a route for every screen in the product.
 *
 * Every route that existed before the redesign is still reachable here.
 */
export const navGroups = [
  {
    group: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      {
        name: 'Analytics',
        path: '/analytics',
        icon: BarChart3,
        children: [
          { name: 'Overview', path: '/analytics', icon: LineChart },
          { name: 'Platform Breakdown', path: '/analytics/platforms', icon: BarChart3 },
        ],
      },
    ],
  },
  {
    group: 'Content',
    items: [
      {
        name: 'Content Library',
        path: '/content',
        icon: Layers,
        children: [
          { name: 'All Content', path: '/content', icon: Layers },
          { name: 'Ideas Workspace', path: '/ideas', icon: Lightbulb },
          { name: 'Opportunity Center', path: '/opportunities', icon: Compass },
        ],
      },
      {
        name: 'AI Workspace',
        path: '/ai',
        icon: Sparkles,
        children: [
          { name: 'Workspace Home', path: '/ai', icon: Gauge },
          { name: 'AI Strategist', path: '/ai/strategist', icon: Sparkles },
          { name: 'Ask My Content', path: '/ai/my-content', icon: Bot },
          { name: 'AI Command Center', path: '/ai/command-center', icon: Command },
        ],
      },
      {
        name: 'Calendar',
        path: '/calendar',
        icon: Calendar,
        children: [
          { name: 'Publishing Calendar', path: '/calendar', icon: Calendar },
          { name: 'Smart Scheduler', path: '/scheduler', icon: Clock },
          { name: 'Publishing Queue', path: '/publishing', icon: Send },
        ],
      },
      {
        name: 'Composer',
        path: '/composer',
        icon: PenTool,
        children: [
          { name: 'Multi-Platform Composer', path: '/composer', icon: PenTool },
          { name: 'AI Generator', path: '/create', icon: Sparkles },
          { name: 'Script Studio', path: '/scripts', icon: FileText },
        ],
      },
      {
        name: 'Video Lab',
        path: '/video-lab',
        icon: Video,
        children: [
          { name: 'Clips & Repurpose', path: '/video-lab', icon: Video },
          { name: 'Thumbnail Lab', path: '/thumbnails', icon: ImageIcon },
        ],
      },
    ],
  },
  {
    group: 'Audience',
    items: [
      {
        name: 'Audience Intelligence',
        path: '/audience',
        icon: Users,
        children: [
          { name: 'Demographics', path: '/audience', icon: Users },
          { name: 'Benchmark Studio', path: '/benchmark', icon: Target },
        ],
      },
      { name: 'Comments', path: '/comments', icon: MessageSquare },
      { name: 'Trend Discovery', path: '/trends', icon: TrendingUp },
    ],
  },
  {
    group: 'Business',
    items: [
      {
        name: 'Monetization',
        path: '/revenue',
        icon: DollarSign,
        children: [
          { name: 'Revenue Overview', path: '/revenue', icon: Wallet },
          { name: 'Brand Deals CRM', path: '/brand-deals', icon: Handshake },
          { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
        ],
      },
      {
        name: 'Brand & Knowledge',
        path: '/brand-kit',
        icon: Palette,
        children: [
          { name: 'Brand Kit', path: '/brand-kit', icon: Palette },
          { name: 'Creator Brain', path: '/creator-brain', icon: Brain },
          { name: 'Creator Memory', path: '/memory', icon: Database },
        ],
      },
      {
        name: 'Reports & Team',
        path: '/reports',
        icon: FileText,
        children: [
          { name: 'Executive Reports', path: '/reports', icon: FileText },
          { name: 'Team Collaboration', path: '/team', icon: UserPlus },
        ],
      },
      { name: 'AI Autopilot', path: '/autopilot', icon: Cpu },
    ],
  },
  {
    group: 'System',
    items: [
      {
        name: 'Settings',
        path: '/settings',
        icon: Settings,
        children: [
          { name: 'Workspace Settings', path: '/settings', icon: Settings },
          { name: 'Notifications', path: '/notifications', icon: Bell },
          { name: 'Security', path: '/security', icon: ShieldCheck },
        ],
      },
    ],
  },
];

export default navGroups;
