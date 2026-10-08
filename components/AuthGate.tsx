'use client';
import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';

type Mode = 'login' | 'signup' | 'recover' | 'reset';
export function AuthGate({ children }: { children: (userId: string) => React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!hasSupabaseConfig) { setLoading(false); return; }
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => { if (event === 'PASSWORD_RECOVERY') setMode('reset'); setSession(next); });
    return () => listener.subscription.unsubscribe();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const redirectTo = window.location.origin + '/';
      if (mode === 'reset') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await supabase.auth.signOut();
        setMode('login'); setPassword('');
        setMessage('Senha alterada. Entre novamente com sua nova senha.');
      } else if (mode === 'recover') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setMessage('Se o e-mail estiver cadastrado, você receberá instruções de recuperação.');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: {
          emailRedirectTo: redirectTo, data: { nome: name.trim() }
        } });
        if (error) throw error;
        setMessage('Cadastro enviado. Confira seu e-mail para confirmar a conta antes de entrar.');
        setMode('login'); setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Não foi possível concluir a operação.'); }
    finally { setBusy(false); }
  }
  if (loading) return <main className="min-h-screen grid place-items-center">Verificando acesso...</main>;
  if (!hasSupabaseConfig) return <main className="min-h-screen grid place-items-center p-6"><div className="max-w-lg rounded-xl bg-amber-50 text-amber-900 p-6"><h1 className="font-bold text-xl">Configuração necessária</h1><p>Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY às variáveis de ambiente do Cloudflare Pages e publique novamente. Não use secret keys.</p></div></main>;
  if (session?.user && mode !== 'reset') return <>{children(session.user.id)}</>;
  return <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <section className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-slate-200">
      <h1 className="text-2xl font-bold text-emerald-800">Controle do Lar</h1>
      <p className="text-slate-500 mt-1 mb-6">Suas finanças, sua conta, seus dados.</p>
      <h2 className="font-semibold text-xl text-slate-800 mb-4">{mode === 'login' ? 'Entrar na conta' : mode === 'signup' ? 'Criar minha conta' : mode === 'reset' ? 'Definir nova senha' : 'Recuperar senha'}</h2>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && <label className="block text-sm text-slate-700">Nome<input required value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded-lg p-3 mt-1" autoComplete="name" /></label>}
        {mode !== 'reset' && <label className="block text-sm text-slate-700">E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded-lg p-3 mt-1" autoComplete="email" /></label>}
        {mode !== 'recover' && <label className="block text-sm text-slate-700">Senha<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded-lg p-3 mt-1" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>}
        {message && <p role="status" className="rounded-lg bg-sky-50 text-sky-900 text-sm p-3">{message}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-emerald-700 text-white font-semibold p-3 disabled:opacity-50">{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Cadastrar' : mode === 'reset' ? 'Alterar senha' : 'Enviar recuperação'}</button>
      </form>
      <div className="flex flex-col gap-3 mt-6 text-sm text-emerald-800">
        {mode !== 'signup' && <button onClick={()=>{setMode('signup');setMessage('')}}>Criar uma conta gratuita</button>}
        {mode !== 'login' && <button onClick={()=>{setMode('login');setMessage('')}}>Já tenho uma conta</button>}
        {mode !== 'recover' && mode !== 'reset' && <button onClick={()=>{setMode('recover');setMessage('')}}>Esqueci minha senha</button>}
      </div>
    </section>
  </main>;
}
