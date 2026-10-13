import React, { useState, useEffect } from 'react';

const ProfileModal = ({ isOpen, onClose, user, onUpdateUser, onLogout, API_URL, authToken }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [role, setRole] = useState(user?.role || 'Geospatial Analyst');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setRole(user.role || 'Geospatial Analyst');
      setBio(user.bio || '');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const updatedLocalUser = {
      ...user,
      full_name: fullName.trim() || user.username,
      role: role.trim() || 'Geospatial Analyst',
      bio: bio.trim()
    };

    try {
      const cache = JSON.parse(localStorage.getItem('geolens_accounts_cache') || '{}');
      if (updatedLocalUser.username) cache[updatedLocalUser.username.toLowerCase()] = updatedLocalUser;
      if (updatedLocalUser.email) cache[updatedLocalUser.email.toLowerCase()] = updatedLocalUser;
      localStorage.setItem('geolens_accounts_cache', JSON.stringify(cache));
    } catch {
      // Ignore storage errors
    }

    onUpdateUser(updatedLocalUser);
    setIsEditing(false);
    setLoading(false);
    setSuccess('Profile updated successfully!');
    setTimeout(() => setSuccess(''), 3000);

    // Background Cloud Sync
    if (authToken && authToken !== 'syncing_token') {
      fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          full_name: updatedLocalUser.full_name,
          role: updatedLocalUser.role,
          bio: updatedLocalUser.bio
        })
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.user) {
            onUpdateUser(data.user);
          }
        })
        .catch(() => {});
    }
  };

  const getInitials = (name, uname) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name[0].toUpperCase();
    }
    return (uname ? uname[0] : 'U').toUpperCase();
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Analyst Profile</h3>
              <p className="text-[11px] text-zinc-400">Authenticated GeoLens User Account</p>
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Avatar & Key Details */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-600 flex items-center justify-center text-zinc-100 font-bold text-lg shadow-inner shrink-0 font-mono">
              {getInitials(user.full_name, user.username)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-zinc-100 truncate">
                  {user.full_name || user.username}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                  Verified
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400 truncate">@{user.username}</p>
              <p className="text-xs text-zinc-300 truncate mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span>{success}</span>
            </div>
          )}

          {/* Fields */}
          {!isEditing ? (
            <div className="space-y-3.5 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Specialization / Role</span>
                <span className="text-zinc-200 font-medium">{user.role || 'Geospatial Analyst'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Biography / Research Focus</span>
                <p className="text-zinc-300 leading-relaxed italic">
                  {user.bio || 'Satellite Imagery & Geospatial Intelligence Explorer'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Role / Specialization</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Geologist, Student, Lead Scientist, GIS Analyst"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Biography / Research Focus</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Action Footer */}
          {!isEditing && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3.5 py-2 rounded-xl font-medium transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/40 text-xs px-3.5 py-2 rounded-xl font-medium transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
