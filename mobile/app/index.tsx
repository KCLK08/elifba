import { Redirect } from 'expo-router';

import { useProfileStore } from '@/store/profileStore';

export default function Index() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const hasProfiles = useProfileStore((s) => s.hasProfiles());

  if (!hydrated) return null;
  if (!hasProfiles) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/home" />;
}
