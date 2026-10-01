import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AnalyticsOverview from './pages/AnalyticsOverview';
import PlatformAnalytics from './pages/PlatformAnalytics';
import ContentLibrary from './pages/ContentLibrary';
import ContentDetail from './pages/ContentDetail';
import ContentDNA from './pages/ContentDNA';
import Ideas from './pages/Ideas';
import OpportunityCenter from './pages/OpportunityCenter';
import AIStrategist from './pages/AIStrategist';
import AIMyContent from './pages/AIMyContent';
import AICommandCenter from './pages/AICommandCenter';
import CalendarPage from './pages/CalendarPage';
import Composer from './pages/Composer';
import AIGenerator from './pages/AIGenerator';
import ScriptStudio from './pages/ScriptStudio';
import VideoLab from './pages/VideoLab';
import ThumbnailLab from './pages/ThumbnailLab';
import Audience from './pages/Audience';
import Comments from './pages/Comments';
import Trends from './pages/Trends';
import Benchmark from './pages/Benchmark';
import SmartScheduler from './pages/SmartScheduler';
import PublishingQueue from './pages/PublishingQueue';
import Autopilot from './pages/Autopilot';
import CreatorBrain from './pages/CreatorBrain';
import CreatorMemory from './pages/CreatorMemory';
import BrandKit from './pages/BrandKit';
import Revenue from './pages/Revenue';
import BrandDeals from './pages/BrandDeals';
import Campaigns from './pages/Campaigns';
import Team from './pages/Team';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Security from './pages/Security';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/analytics" element={<Layout><AnalyticsOverview /></Layout>} />
        <Route path="/analytics/platforms" element={<Layout><PlatformAnalytics /></Layout>} />

        <Route path="/content" element={<Layout><ContentLibrary /></Layout>} />
        <Route path="/content/:id" element={<Layout><ContentDetail /></Layout>} />
        <Route path="/content/:id/dna" element={<Layout><ContentDNA /></Layout>} />

        <Route path="/ideas" element={<Layout><Ideas /></Layout>} />
        <Route path="/opportunities" element={<Layout><OpportunityCenter /></Layout>} />

        <Route path="/ai/strategist" element={<Layout><AIStrategist /></Layout>} />
        <Route path="/ai/my-content" element={<Layout><AIMyContent /></Layout>} />
        <Route path="/ai/command-center" element={<Layout><AICommandCenter /></Layout>} />

        <Route path="/calendar" element={<Layout><CalendarPage /></Layout>} />
        <Route path="/composer" element={<Layout><Composer /></Layout>} />

        <Route path="/create" element={<Layout><AIGenerator /></Layout>} />
        <Route path="/scripts" element={<Layout><ScriptStudio /></Layout>} />

        <Route path="/video-lab" element={<Layout><VideoLab /></Layout>} />
        <Route path="/thumbnails" element={<Layout><ThumbnailLab /></Layout>} />

        <Route path="/audience" element={<Layout><Audience /></Layout>} />
        <Route path="/comments" element={<Layout><Comments /></Layout>} />
        <Route path="/trends" element={<Layout><Trends /></Layout>} />
        <Route path="/benchmark" element={<Layout><Benchmark /></Layout>} />

        <Route path="/scheduler" element={<Layout><SmartScheduler /></Layout>} />
        <Route path="/publishing" element={<Layout><PublishingQueue /></Layout>} />

        <Route path="/autopilot" element={<Layout><Autopilot /></Layout>} />
        <Route path="/creator-brain" element={<Layout><CreatorBrain /></Layout>} />
        <Route path="/memory" element={<Layout><CreatorMemory /></Layout>} />
        <Route path="/brand-kit" element={<Layout><BrandKit /></Layout>} />

        <Route path="/revenue" element={<Layout><Revenue /></Layout>} />
        <Route path="/brand-deals" element={<Layout><BrandDeals /></Layout>} />
        <Route path="/campaigns" element={<Layout><Campaigns /></Layout>} />

        <Route path="/team" element={<Layout><Team /></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />

        <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/security" element={<Layout><Security /></Layout>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

