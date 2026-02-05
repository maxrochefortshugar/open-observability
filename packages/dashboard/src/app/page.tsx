import { Dashboard } from '@/components/pages/Dashboard';

export default function Home() {
  const siteId = process.env.NEXT_PUBLIC_SITE_ID || 'default';

  return <Dashboard siteId={siteId} />;
}
