'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-flame-500/20 border-b border-flame-500/40 text-flame-400 text-xs sm:text-sm font-medium py-2 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-md"
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>You are currently offline. Mutating actions are disabled until connection is restored.</span>
    </div>
  );
}
