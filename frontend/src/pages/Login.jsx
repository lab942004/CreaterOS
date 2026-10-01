import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Form';
import { Alert } from '../components/ui/Feedback';
import { api } from '../services/api';

const DEMO = { email: 'creator@creatoros.ai', password: 'CreatorOS@2026' };

export default function Login() {
  const [email, setEmail] = useState(DEMO.email);
  const [password, setPassword] = useState(DEMO.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('creatoros_token', res.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your content operating system."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <NavLink to="/register" className="font-semibold text-brand hover:underline">
            Create one free
          </NavLink>
        </>
      }
    >
      {error ? (
        <Alert tone="error" title="Could not sign you in" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleLogin} className="space-y-4">
        <Field label="Email address" htmlFor="email">
          <Input
            id="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          action={
            <NavLink to="/forgot-password" className="text-caption font-semibold text-brand hover:underline">
              Forgot password?
            </NavLink>
          }
        >
          <Input
            id="password"
            type="password"
            icon={Lock}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <Button type="submit" variant="ai" size="lg" full loading={loading} iconRight={ArrowRight}>
          {loading ? 'Authenticating…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-caption text-ink-3">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Alert tone="ai" className="mt-4" title="Demo workspace">
        <span className="block">
          Credentials are pre-filled. Press <strong className="text-ink">Sign in</strong> to explore the full product with
          seeded data — <span className="font-mono text-ink-2">{DEMO.email}</span>
        </span>
        <Sparkles className="hidden" aria-hidden="true" />
      </Alert>
    </AuthShell>
  );
}
