'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type SettingsRow = {
  user_id: string;
  ship24_api_key: string | null;
  notify_webhook_url: string | null;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [ship24ApiKey, setShip24ApiKey] = useState('');
  const [notifyWebhookUrl, setNotifyWebhookUrl] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id || null;
      setUserId(uid);

      if (uid) {
        const { data, error } = await supabase
          .from('user_api_settings')
          .select('*')
          .eq('user_id', uid)
          .single();

        if (!error && data) {
          const row = data as SettingsRow;
          setShip24ApiKey(row.ship24_api_key ?? '');
          setNotifyWebhookUrl(row.notify_webhook_url ?? '');
          setTelegramBotToken(row.telegram_bot_token ?? '');
          setTelegramChatId(row.telegram_chat_id ?? '');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);

    const { error } = await supabase.from('user_api_settings').upsert({
      user_id: userId,
      ship24_api_key: ship24ApiKey || null,
      notify_webhook_url: notifyWebhookUrl || null,
      telegram_bot_token: telegramBotToken || null,
      telegram_chat_id: telegramChatId || null,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (error) {
      alert('Error saving settings: ' + error.message);
    } else {
      alert('Settings saved.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b82f680,transparent_60%),linear-gradient(180deg,#0b1224,#0c1020_40%,#0a0f1a)]">
        Loading settings…
      </div>
    );
  }

  return (
    <main className="min-h-screen text-white bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b82f6AA,transparent_60%),linear-gradient(180deg,#0b1224,#0c1020_40%,#0a0f1a)]">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-cyan-300 hover:text-white transition hover:shadow-[0_0_10px] hover:shadow-cyan-500/60 rounded px-2 py-1"
          >
            ← Back
          </Link>
          <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
          <div className="w-[80px]" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-md">
          <h2 className="text-lg font-semibold mb-5">API Keys & Integrations</h2>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-neutral-300/90 mb-1">
                Ship24 API Key
              </label>
              <input
                type="password"
                value={ship24ApiKey}
                onChange={(e) => setShip24ApiKey(e.target.value)}
                placeholder="sk_live_…"
                className="block w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
              />
              <p className="text-xs text-neutral-400 mt-1">
                Used for parcel tracking in <code className="text-neutral-300">/api/track</code>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300/90 mb-1">
                Notification Webhook URL (optional)
              </label>
              <input
                type="url"
                value={notifyWebhookUrl}
                onChange={(e) => setNotifyWebhookUrl(e.target.value)}
                placeholder="https://your-webhook.example.com"
                className="block w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
              />
              <p className="text-xs text-neutral-400 mt-1">
                Alternative to Telegram for <code className="text-neutral-300">/api/notify</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300/90 mb-1">
                  Telegram Bot Token (optional)
                </label>
                <input
                  type="password"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="123456:ABC-DEF…"
                  className="block w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300/90 mb-1">
                  Telegram Chat ID (optional)
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="123456789"
                  className="block w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60 transition-shadow hover:shadow-[0_0_8px] hover:shadow-cyan-500/60"
              >
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-xs text-neutral-400">
          <p>
            <strong>Note:</strong> This page stores keys per user in{' '}
            <code className="text-neutral-300">user_api_settings</code> (RLS-protected).
            If you want <code>/api/track</code> or <code>/api/notify</code> to use these
            values instead of environment variables, we can wire that up next.
          </p>
        </div>
      </div>
    </main>
  );
}
