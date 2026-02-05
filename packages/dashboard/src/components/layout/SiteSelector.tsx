'use client';

import React, { useState } from 'react';
import type { Site } from '@/hooks/useSites';

interface SiteSelectorProps {
  sites: Site[];
  selectedSiteId: string | null;
  onSelect: (siteId: string) => void;
  onCreateSite: (siteId: string, name: string) => Promise<void>;
}

export function SiteSelector({
  sites,
  selectedSiteId,
  onSelect,
  onCreateSite,
}: SiteSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newSiteId, setNewSiteId] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = sites.find((s) => s.site_id === selectedSiteId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await onCreateSite(newSiteId.trim(), newSiteName.trim());
      setShowCreate(false);
      setNewSiteId('');
      setNewSiteName('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create site');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md bg-[var(--color-muted)] px-2.5 py-1 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
      >
        {selected?.name || selectedSiteId || 'Select site'}
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop to close dropdown */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-1 shadow-lg">
            {sites.map((site) => (
              <button
                key={site.id}
                type="button"
                onClick={() => {
                  onSelect(site.site_id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-muted)] ${
                  site.site_id === selectedSiteId
                    ? 'font-medium text-brand-500'
                    : 'text-[var(--color-foreground)]'
                }`}
              >
                <span>{site.name}</span>
                <span className="text-xs text-[var(--color-muted-foreground)]">{site.role}</span>
              </button>
            ))}

            {!showCreate && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex w-full items-center gap-2 border-t border-[var(--color-border)] px-3 py-2 text-left text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Site
              </button>
            )}

            {showCreate && (
              <form
                onSubmit={handleCreate}
                className="border-t border-[var(--color-border)] p-3 space-y-2"
              >
                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
                <input
                  type="text"
                  required
                  placeholder="Site ID (e.g. my-site)"
                  value={newSiteId}
                  onChange={(e) => setNewSiteId(e.target.value)}
                  className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-sm outline-none focus:border-brand-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Display name"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-sm outline-none focus:border-brand-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 rounded bg-brand-500 px-2 py-1 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                  >
                    {creating ? '...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setError(null);
                    }}
                    className="rounded px-2 py-1 text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
