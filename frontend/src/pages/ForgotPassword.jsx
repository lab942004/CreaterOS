import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Form';
import { Alert } from '../components/ui/Feedback';
import { api } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.forgotPassword({ email });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure link to choose a new one."
      headline="Your workspace stays locked down while you recover access."
      points={[
        'Reset links expire after 30 minutes',
        'All active sessions stay visible in Security',
        'Two-factor authentication is available in Settings',
      ]}
      footer={
        <>
          Remembered it?{' '}
          <NavLink to="/login" className="font-semibold text-brand hover:underline">
            Back to sign in
          </NavLink>
        </>
      }
    >
      {submitted ? (
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lead font-semibold text-ink">Check your inbox</h2>
            <p className="mt-1 text-label text-ink-2">
              We sent password reset instructions to <span className="font-semibold text-ink">{email}</span>.
            </p>
          </div>
          <Button to="/login" variant="secondary" size="lg" full iconRight={ArrowRight}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email address" htmlFor="reset-email" hint="Use the address you registered with.">
            <Input
              id="reset-email"
              type="email"
              icon={Mail}
              autoComplete="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Button type="submit" variant="ai" size="lg" full loading={loading} iconRight={ArrowRight}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>

          <Alert tone="info" title="Heads up">
            Demo environments do not deliver email. Any address will return a success state.
          </Alert>
        </form>
      )}
    </AuthShell>
  );
}
