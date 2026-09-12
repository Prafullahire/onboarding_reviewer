import { useEffect, useState } from 'react';

type Status = 'checking' | 'online' | 'offline';

export function BackendStatus() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const check = async () => {
      try {
        const base = import.meta.env.VITE_API_BASE_URL ?? '/api';
        const res = await fetch(`${base}/health`);
        setStatus(res.ok ? 'online' : 'offline');
      } catch {
        setStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking' || status === 'online') return null;

  return (
    <div className="alert alert-error">
      <span>
        <strong>Backend offline.</strong> Ensure MySQL is running, then start the server with{' '}
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>npm run dev</code>
      </span>
    </div>
  );
}
