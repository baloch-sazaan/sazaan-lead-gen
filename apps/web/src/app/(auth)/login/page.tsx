'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BackgroundBeams } from '@/components/aceternity/background-beams';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    } else {
      setStatus('success');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-bg-base">
      <div className="z-10 w-full max-w-md p-8 glass-panel rounded-2xl flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-text-primary">Sazaan Lead Engine</h1>
          <p className="text-text-secondary mt-2">Sign in to your account</p>
        </div>

        {status === 'success' ? (
          <div className="bg-accent-success/10 border border-accent-success/20 text-accent-success p-4 rounded-lg text-center">
            Check your email for the magic link!
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-text-secondary">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.1] rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            
            {status === 'error' && (
              <div className="text-sm text-accent-danger">{errorMessage}</div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-accent-primary hover:bg-accent-glow text-white rounded-lg px-4 py-2.5 font-medium transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}
      </div>
      <BackgroundBeams />
    </div>
  );
}
