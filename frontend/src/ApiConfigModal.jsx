import React, { useState } from 'react';

const ApiConfigModal = ({ isOpen, onClose, currentApiUrl, onSaveApiUrl }) => {
  const [url, setUrl] = useState(currentApiUrl || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: bool, message: string }

  if (!isOpen) return null;

  const handleTest = async () => {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl) {
      setTestResult({ success: false, message: 'Please enter a URL first.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${cleanUrl}/health`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: `Connected successfully! (Service: ${data.service || 'GeoLens'})`
        });
      } else {
        setTestResult({
          success: false,
          message: `Server reachable but returned status ${res.status}.`
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Could not reach server. Verify the URL and ensure Render Web Service is running.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const cleanUrl = url.trim().replace(/\/+$/, '');
    onSaveApiUrl(cleanUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Backend API URL Setup</h3>
              <p className="text-[11px] text-zinc-400">Connect your deployed Render backend</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider font-mono">
              Render Backend URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTestResult(null);
              }}
              placeholder="https://geolens-backend.onrender.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
            <p className="text-[10px] text-zinc-500 mt-1.5">
              Copy the URL from your <strong>Render Dashboard</strong> (e.g. <code>https://your-app.onrender.com</code>).
            </p>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              testResult.success 
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' 
                : 'bg-red-950/40 border-red-800/60 text-red-200'
            }`}>
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${testResult.success ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !url.trim()}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-40"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              type="submit"
              className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
            >
              Save & Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiConfigModal;
