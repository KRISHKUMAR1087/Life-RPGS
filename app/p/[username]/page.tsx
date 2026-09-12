import type { Metadata } from 'next';
import PublicProfileView from '@/components/PublicProfileView';

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = decodeURIComponent(params.username);
  return {
    title: `${username} — LifeQuest Hero Profile`,
    description: `Check out ${username}'s hero achievements, level, streak, and stats on LifeQuest RPG!`,
  };
}

export default function PublicProfilePage({ params }: Props) {
  const username = decodeURIComponent(params.username);
  return <PublicProfileView username={username} />;
}
