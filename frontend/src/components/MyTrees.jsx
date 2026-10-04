import React, { useState, useEffect } from 'react';
import { BookOpen, Edit3, Eye, Clock, CheckCircle, XCircle, GitBranch, MapPin, Users, Plus } from 'lucide-react';
import { apiFetch, getAuthToken } from '../utils/api';

export default function MyTrees({ villages, onViewTree, onEditTree, onBuildNew, onOpenAuth }) {
  const [myTrees, setMyTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = getAuthToken();

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch('/family/my-trees');
        setMyTrees(data);
      } catch (err) {
        setError(err.message || 'Failed to load your trees.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const statusInfo = {
    approved:  { label: 'Approved',  color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    pending:   { label: 'Under Review', color: 'bg-amber-100 text-amber-800', icon: Clock },
    rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-800',     icon: XCircle },
  };

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-20 h-20 bg-saffron-100 text-saffron-600 rounded-full flex items-center justify-center mx-auto">
          <BookOpen className="w-10 h-10" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-slate-900">My Family Trees</h2>
        <p className="text-slate-500">Please log in to view and manage your submitted family trees.</p>
        <button
          onClick={onOpenAuth}
          className="bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-colors"
        >
          Login / Register
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 text-center">
        <div className="w-8 h-8 border-4 border-saffron-200 border-t-saffron-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Loading your family trees...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-saffron-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-saffron-100 text-saffron-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" /> My Submissions
          </div>
          <h2 className="font-serif text-3xl font-bold text-slate-900">My Family Trees</h2>
          <p className="text-slate-500 text-sm mt-1">
            View, edit or add to your submitted family trees. Approved trees are visible in the community directory.
          </p>
        </div>
        <button
          onClick={onBuildNew}
          className="self-start sm:self-auto bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Build New Tree
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{error}</div>
      )}

      {myTrees.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 space-y-4">
          <div className="w-16 h-16 bg-saffron-50 text-saffron-400 rounded-2xl flex items-center justify-center mx-auto">
            <GitBranch className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl font-bold text-slate-900">No Trees Submitted Yet</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            You haven't submitted any family trees yet. Build your first family tree and submit it for admin approval.
          </p>
          <button
            onClick={onBuildNew}
            className="inline-flex items-center gap-2 bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-colors mt-2"
          >
            <Plus className="w-4 h-4" /> Build My First Family Tree
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myTrees.map((tree) => {
            const si = statusInfo[tree.status] || statusInfo.pending;
            const StatusIcon = si.icon;
            return (
              <div key={tree.id} className="bg-white rounded-3xl border border-saffron-100 shadow-sm overflow-hidden hover:border-saffron-300 transition-colors">

                {/* Top colour strip */}
                <div className={`h-1.5 w-full ${tree.status === 'approved' ? 'bg-emerald-400' : tree.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'}`} />

                <div className="p-6 space-y-4">
                  {/* Status badge */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full uppercase ${si.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {si.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(tree.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Tree details */}
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900">{tree.family_name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-saffron-500" />{tree.village_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-saffron-500" />{tree.members?.length || 0} members</span>
                    </div>
                  </div>

                  {/* Admin notes if rejected */}
                  {tree.status === 'rejected' && tree.admin_notes && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                      <strong>Admin Note:</strong> {tree.admin_notes}
                    </div>
                  )}

                  {/* Member photo strip */}
                  <div className="flex items-center gap-1.5">
                    {(tree.members || []).slice(0, 7).map((m) => (
                      <div key={m.id} className="w-9 h-9 rounded-full border-2 border-white shadow-sm overflow-hidden bg-saffron-50 flex items-center justify-center text-base shrink-0">
                        {m.photo_url
                          ? <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                          : <span>{m.gender === 'Female' ? '👩' : '👨'}</span>
                        }
                      </div>
                    ))}
                    {(tree.members?.length || 0) > 7 && (
                      <div className="w-9 h-9 rounded-full bg-saffron-100 text-saffron-700 flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm shrink-0">
                        +{tree.members.length - 7}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onViewTree(tree.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Tree
                    </button>
                    <button
                      onClick={() => onEditTree(tree)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-saffron-500 hover:bg-saffron-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit & Resubmit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
