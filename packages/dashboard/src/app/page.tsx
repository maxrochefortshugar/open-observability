'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useSites } from '@/hooks/useSites';
import { LoginPage } from '@/components/auth/LoginPage';
import { Dashboard } from '@/components/pages/Dashboard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Onboarding } from '@/components/pages/Onboarding';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { sites, selectedSiteId, selectSite, createSite, loading: sitesLoading } = useSites();

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPage />;
  }

  if (sitesLoading) {
    return <LoadingSpinner />;
  }

  if (sites.length === 0 || !selectedSiteId) {
    return <Onboarding onCreateSite={createSite} />;
  }

  return (
    <Dashboard
      siteId={selectedSiteId}
      sites={sites}
      selectedSiteId={selectedSiteId}
      onSelectSite={selectSite}
      onCreateSite={createSite}
    />
  );
}
