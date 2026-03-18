import React, { useState } from 'react';
import { X, Mail, Lock, Chrome, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
      <div className="bg-bg border-2 border-line w-full max-w-md p-8 shadow-[16px_16px_0px_0px_rgba(20,20,20,1)] relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 hover:text-accent transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="text-xs font-mono uppercase tracking-widest opacity-50 mb-8">
          {isLogin ? 'Login to access your watchlist' : 'Join the search engine for AI agents'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-1 opacity-60">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input 
                type="email" 
                required
                className="w-full bg-white border-2 border-line py-3 pl-10 pr-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-1 opacity-60">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input 
                type="password" 
                required
                className="w-full bg-white border-2 border-line py-3 pl-10 pr-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-[10px] font-mono uppercase">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-bg py-4 font-mono uppercase text-sm hover:bg-accent hover:text-ink transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-grow h-px bg-line/10"></div>
          <span className="text-[10px] font-mono uppercase opacity-40">OR</span>
          <div className="flex-grow h-px bg-line/10"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white border-2 border-line py-3 font-mono uppercase text-sm hover:bg-bg transition-all flex items-center justify-center gap-2"
        >
          <Chrome className="w-4 h-4" /> Continue with Google
        </button>

        <p className="mt-8 text-center text-[10px] font-mono uppercase tracking-widest">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-accent hover:underline font-bold"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
