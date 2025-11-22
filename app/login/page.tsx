"use client";

import { useState } from 'react';
import { useRedmine } from '@/lib/context';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login } = useRedmine();
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(url, apiKey);
    } catch (error) {
      console.error(error);
      alert('Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Redmine Chat
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter your Redmine details to connect
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="url" className="sr-only">Redmine URL</label>
              <input
                id="url"
                name="url"
                type="text"
                required
                className="relative block w-full rounded-md border-0 bg-gray-700 py-2.5 px-3 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm sm:leading-6"
                placeholder="Redmine URL (e.g. https://redmine.example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="api-key" className="sr-only">API Key</label>
              <input
                id="api-key"
                name="api-key"
                type="password"
                required
                className="relative block w-full rounded-md border-0 bg-gray-700 py-2.5 px-3 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm sm:leading-6"
                placeholder="API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "group relative flex w-full justify-center rounded-md bg-indigo-600 py-2.5 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all",
                isLoading && "opacity-70 cursor-not-allowed"
              )}
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
          
          <div className="text-xs text-center text-gray-500">
            For testing, use any URL containing "mock" (e.g. mock.redmine.com)
          </div>
        </form>
      </div>
    </div>
  );
}
