'use client';
import { useEffect } from 'react';
export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch(err => console.warn('PWA offline:', err));
    }
  }, []);
  return null;
}
