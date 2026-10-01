import React from 'react';
import { DollarSign, Eye, Heart, Users } from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';

/**
 * DashboardCards — the KPI row.
 * Values fall back to an em dash so an incomplete API payload never renders
 * "undefined" in the primary metric position.
 */
export function DashboardCards({ metrics }) {
  const format = (value) => (typeof value === 'number' ? value.toLocaleString() : '—');

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total views"
        value={format(metrics?.totalViews)}
        delta={18.2}
        caption="vs. previous 30 days"
        icon={Eye}
        tone="brand"
      />
      <MetricCard
        label="Audience network"
        value={format(metrics?.totalFollowers)}
        delta="+34.4k net"
        deltaDirection="up"
        caption="across all channels"
        icon={Users}
        tone="cyan"
      />
      <MetricCard
        label="Avg engagement"
        value={typeof metrics?.engagementRate === 'number' ? `${metrics.engagementRate}%` : '—'}
        delta="2.4x"
        deltaDirection="up"
        caption="vs. platform average"
        icon={Heart}
        tone="warning"
      />
      <MetricCard
        label="Monthly revenue"
        value={typeof metrics?.monthlyRevenue === 'number' ? `$${format(metrics.monthlyRevenue)}` : '—'}
        delta="$4,200"
        deltaDirection="up"
        caption="new sponsor deal"
        icon={DollarSign}
        tone="success"
      />
    </div>
  );
}

export default DashboardCards;
