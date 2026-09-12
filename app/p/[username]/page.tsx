import type { Metadata } from 'next';
import PublicProfileView from '@/components/PublicProfileView';

export const runtime = 'edge';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username: rawName } = await params;
  const username = decodeURIComponent(rawName);
  return {
    title: `${username} — LifeQuest Hero Profile`,
    description: `Check out ${username}'s hero achievements, level, streak, and stats on LifeQuest RPG!`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username: rawName } = await params;
  const username = decodeURIComponent(rawName);
  return <PublicProfileView username={username} />;
}
