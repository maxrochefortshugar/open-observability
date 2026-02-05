'use client';

import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-brand-500" />
    </div>
  );
}
