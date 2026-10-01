import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Moon, Sun, UserPlus } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { IconButton } from '../components/ui/Button';
import { useTheme } from '../theme/ThemeProvider';
import { api } from '../services/api';
import { OnboardingFooter, OnboardingRail } from '../components/onboarding/OnboardingRail';
import {
  StepAudience, StepContentType, StepCreatorName, StepCreatorType, StepWelcome,
} from '../components/onboarding/OnboardingProfileSteps';
import { StepBrandVoice, StepImport, StepPlatforms } from '../components/onboarding/OnboardingSetupSteps';
import { StepAnalyzing, StepInsight } from '../components/onboarding/OnboardingAnalysisSteps';

const STEPS = [
  { id: 1, label: 'Welcome' },
  { id: 2, label: 'Creator name' },
  { id: 3, label: 'Creator type' },
  { id: 4, label: 'Content type' },
  { id: 5, label: 'Target audience' },
  { id: 6, label: 'Brand voice' },
  { id: 7, label: 'Connect platforms' },
  { id: 8, label: 'Import content' },
  { id: 9, label: 'Analyze content' },
  { id: 10, label: 'First AI insight' },
];

const ALL_PLATFORMS = ['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'LINKEDIN', 'TWITTER', 'FACEBOOK'];

/**
 * Onboarding — the ten-step activation wizard.
 * Collects the profile that calibrates the whole workspace, persists progress
 * through the existing auth/onboarding endpoint, then hands off to the shell.
 */
export default function Onboarding() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const [name, setName] = useState('Alex Rivera');
  const [handle, setHandle] = useState('@alexriveratech');
  const [creatorType, setCreatorType] = useState('SOLO');
  const [contentTypes, setContentTypes] = useState(['VIDEO', 'SHORT']);
  const [audience, setAudience] = useState(
    'Software engineers and technical founders who want to ship AI features without a research team.'
  );
  const [audienceSize, setAudienceSize] = useState('906,900 followers across channels');
  const [tones, setTones] = useState(['Authoritative', 'Actionable']);
  const [voice, setVoice] = useState('');
  const [platforms, setPlatforms] = useState(['YOUTUBE', 'TIKTOK', 'LINKEDIN']);
  const [importSelection, setImportSelection] = useState(['HISTORY', 'ANALYTICS']);

  const togglePlatform = (value) =>
    setPlatforms((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]));

  const profileData = useMemo(
    () => ({
      name,
      handle,
      creatorType,
      contentTypes,
      audience,
      audienceSize,
      tones,
      platforms,
      importSelection,
      // Legacy keys retained so the existing onboarding payload stays compatible.
      niche: audience,
      goals: ['Grow audience', 'Save time'],
      voice: voice || tones.join(', '),
    }),
    [name, handle, creatorType, contentTypes, audience, audienceSize, tones, platforms, importSelection, voice]
  );

  const persist = useCallback(
    async (nextStep, completed) => {
      try {
        await api.updateOnboarding({ step: nextStep, completed, profileData });
      } catch {
        /* progress sync is best-effort and must never block the wizard */
      }
    },
    [profileData]
  );

  const goNext = async () => {
    if (step < STEPS.length) {
      const next = step + 1;
      setStep(next);
      persist(next, false);
      return;
    }
    setSaving(true);
    await persist(STEPS.length, true);
    navigate('/dashboard');
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));
  const progress = Math.round((step / STEPS.length) * 100);
  const analyzing = step === 9 && !analysisComplete;

  return (
    <div className="flex min-h-screen bg-app text-ink">
      <OnboardingRail steps={STEPS} current={step} />

      <main className="flex flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line px-5 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Logo size={30} showTagline={false} />
          </div>
          <div className="hidden items-center gap-2 text-caption text-ink-3 lg:flex">
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
            Step {step} of {STEPS.length}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-semibold text-ink">{STEPS[step - 1].label}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconButton
              label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              icon={theme === 'dark' ? Sun : Moon}
              onClick={toggleTheme}
            />
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-caption font-semibold text-ink-3 transition-colors hover:text-ink"
            >
              Skip setup
            </button>
          </div>
        </header>
        <div className="cs-scroll-y flex flex-1 justify-center px-5 py-8 lg:px-8">
          <div key={step} className="w-full max-w-[620px] cs-anim-up">
            {step === 1 ? <StepWelcome /> : null}
            {step === 2 ? <StepCreatorName name={name} handle={handle} setName={setName} setHandle={setHandle} /> : null}
            {step === 3 ? <StepCreatorType value={creatorType} onChange={setCreatorType} /> : null}
            {step === 4 ? <StepContentType value={contentTypes} onChange={setContentTypes} /> : null}
            {step === 5 ? (
              <StepAudience
                audience={audience}
                setAudience={setAudience}
                audienceSize={audienceSize}
                setAudienceSize={setAudienceSize}
              />
            ) : null}
            {step === 6 ? (
              <StepBrandVoice tones={tones} setTones={setTones} voice={voice} setVoice={setVoice} />
            ) : null}
            {step === 7 ? (
              <StepPlatforms
                platforms={platforms}
                togglePlatform={togglePlatform}
                onSelectAll={() => setPlatforms(ALL_PLATFORMS)}
              />
            ) : null}
            {step === 8 ? <StepImport selection={importSelection} setSelection={setImportSelection} /> : null}
            {step === 9 ? <StepAnalyzing onComplete={() => setAnalysisComplete(true)} /> : null}
            {step === 10 ? <StepInsight name={name} tones={tones} platforms={platforms} /> : null}
          </div>
        </div>

        <OnboardingFooter
          step={step}
          total={STEPS.length}
          progress={progress}
          onBack={goBack}
          onNext={goNext}
          saving={saving}
          nextDisabled={analyzing}
          nextLabel={step === STEPS.length ? 'Enter workspace' : analyzing ? 'Analyzing…' : 'Continue'}
        />
      </main>
    </div>
  );
}
