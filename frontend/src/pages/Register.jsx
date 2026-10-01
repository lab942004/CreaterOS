import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Form';
import { Alert } from '../components/ui/Feedback';
import { api } from '../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.register({ name, email, password });
      localStorage.setItem('creatoros_token', res.token);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Free forever on one channel. Upgrade whenever you outgrow it."
      headline="Everything you publish, planned by a system that reads your data."
      footer={
        <>
          Already have an account?{' '}
          <NavLink to="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </NavLink>
        </>
      }
    >
      {error ? (
        <Alert tone="error" title="Could not create your account" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleRegister} className="space-y-4">
        <Field label="Full name" htmlFor="name">
          <Input
            id="name"
            type="text"
            icon={User}
            autoComplete="name"
            placeholder="Alex Rivera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" hint="8+ characters">
            <Input
              id="password"
              type="password"
              icon={Lock}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          <Field label="Confirm" htmlFor="confirm-password">
            <Input
              id="confirm-password"
              type="password"
              icon={Lock}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Field>
        </div>

        <Button type="submit" variant="ai" size="lg" full loading={loading} iconRight={ArrowRight}>
          {loading ? 'Creating workspace…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-4 text-caption leading-relaxed text-ink-3">
        By continuing you agree to the CreatorOS terms of service and confirm you have read the privacy policy.
      </p>
    </AuthShell>
  );
}
