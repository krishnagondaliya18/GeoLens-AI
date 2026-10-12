import React, { useState, useEffect } from 'react';

const HistoryModal = ({ isOpen, onClose, API_URL, authToken, onLoadAnalysis }) => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, authToken]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${API_URL}/api/history?limit=50`, { headers });
      const data = await res.json();
      if (res.ok && data.analyses) {
        setAnalyses(data.analyses);
      }
    } catch (e) {
      console.warn("Error fetching analysis history:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this analysis record?")) return;
    try {
      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${API_URL}/api/history/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setAnalyses(prev => prev.filter(item => (item.id || item._id) !== id));
        if (selectedItem && (selectedItem.id || selectedItem._id) === id) {
          setSelectedItem(null);
        }
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear your entire analysis history?")) return;
    try {
      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${API_URL}/api/history`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setAnalyses([]);
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Clear all failed", err);
    }
  };

  if (!isOpen) return null;

  const filteredAnalyses = analyses.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.prompt || '').toLowerCase().includes(q) ||
      (item.response_text || '').toLowerCase().includes(q) ||
      (item.model || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-4xl max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-100">Satellite Analysis History</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
                  MongoDB Atlas Cloud
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Persistent satellite telemetry, visual contours, and query logs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {analyses.length > 0 && authToken && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg hover:bg-red-950/40 border border-red-900/30 transition-colors"
              >
                Clear All
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <svg className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by question, answer keywords, or model..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 font-sans"
            />
          </div>
          <span className="text-[11px] font-mono text-zinc-500 shrink-0">
            {filteredAnalyses.length} / {analyses.length} saved
          </span>
        </div>

        {/* List / Detail Split */}
        <div className="flex-1 min-h-0 flex divide-x divide-zinc-800 overflow-hidden">
          {/* Left: Scrollable List */}
          <div className="w-1/2 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching records from MongoDB Atlas...</span>
              </div>
            ) : filteredAnalyses.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-xs">
                <p className="font-medium text-zinc-400">No analyses found</p>
                <p className="text-[11px] mt-1 text-zinc-600">
                  {analyses.length === 0 
                    ? "Queries you execute while signed in will automatically persist here." 
                    : "No records matched your filter search."}
                </p>
              </div>
            ) : (
              filteredAnalyses.map((item) => {
                const id = item.id || item._id;
                const isSelected = selectedItem && (selectedItem.id || selectedItem._id) === id;
                return (
                  <div
                    key={id}
                    onClick={() => setSelectedItem(item)}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                      isSelected 
                        ? 'bg-zinc-800/90 border-zinc-600 shadow-md' 
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    {/* Thumbnail if available */}
                    {item.image_meta?.thumbnail ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center">
                        <img 
                          src={item.image_meta.thumbnail} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center text-zinc-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-zinc-400">
                          {formatDate(item.created_at)}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 uppercase">
                            {item.mode || 'VQA'}
                          </span>
                          {authToken && (
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, id)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-0.5 rounded transition-opacity"
                              title="Delete record"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-medium text-zinc-200 truncate" title={item.prompt}>
                        {item.prompt || "Satellite Scene Caption"}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {item.response_text ? item.response_text.slice(0, 80) : "No output text"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Selected Detail Viewer */}
          <div className="w-1/2 overflow-y-auto p-5 bg-zinc-950/40 custom-scrollbar flex flex-col justify-between">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500">Query Details</span>
                    <h4 className="text-xs font-semibold text-zinc-100 mt-0.5">
                      {selectedItem.prompt || "Satellite Scene Caption"}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadAnalysis(selectedItem);
                      onClose();
                    }}
                    className="bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Load in Workspace</span>
                  </button>
                </div>

                {/* Thumbnail Preview */}
                {selectedItem.image_meta?.thumbnail && (
                  <div className="w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center max-h-48">
                    <img 
                      src={selectedItem.image_meta.thumbnail} 
                      alt="Full Thumbnail" 
                      className="max-h-48 w-auto object-contain"
                    />
                  </div>
                )}

                {/* Model & Metadata Bar */}
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    Model: {selectedItem.model || 'gemini-2.5-flash'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    Mode: {selectedItem.mode || 'VQA'}
                  </span>
                  {selectedItem.bboxes && selectedItem.bboxes.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">
                      Grounding: {selectedItem.bboxes.length} boxes
                    </span>
                  )}
                </div>

                {/* Full Response Text */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1.5">
                    Analysis Response
                  </span>
                  <div className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-xl text-xs text-zinc-200 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                    {selectedItem.response_text}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 text-xs">
                <svg className="w-8 h-8 text-zinc-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-medium text-zinc-400">Select an analysis from the list</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  View satellite contours, bounding boxes, and load previous telemetry into the viewer.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
