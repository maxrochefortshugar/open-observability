'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

interface OnboardingProps {
  onCreateSite: (siteId: string, name: string) => Promise<void>;
}

export function Onboarding({ onCreateSite }: OnboardingProps) {
  const { signOut } = useAuth();
  const [siteId, setSiteId] = useState('');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await onCreateSite(siteId.trim(), name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create site');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <h1 className="mb-1 text-center text-2xl font-bold tracking-tight">
            Welcome to open-observability
          </h1>
          <p className="mb-6 text-center text-sm text-[var(--color-muted-foreground)]">
            Create your first site to get started.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="site-id"
                className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
              >
                Site ID
              </label>
              <input
                id="site-id"
                type="text"
                required
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="my-site"
              />
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Must match the site ID used in your tracker script.
              </p>
            </div>

            <div>
              <label
                htmlFor="site-name"
                className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
              >
                Display Name
              </label>
              <input
                id="site-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="My Website"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Site'}
            </button>
          </form>

          <button
            type="button"
            onClick={signOut}
            className="mt-4 w-full text-center text-sm text-[var(--color-muted-foreground)] hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
