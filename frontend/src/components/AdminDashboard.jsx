import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Users, GitBranch, MapPin, Clock, Eye, Trash2, Key, Lock, Plus, Building2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { apiFetch } from '../utils/api';

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const styles = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    error: 'bg-red-50 border-red-300 text-red-800',
    info: 'bg-saffron-50 border-saffron-300 text-saffron-800',
  };
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;
  return (
    <div className={`fixed top-5 right-5 z-[999] flex items-start gap-3 border px-5 py-4 rounded-2xl shadow-xl max-w-sm text-sm font-medium ${styles[type]}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="text-center space-y-2">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{message}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-saffron-500 hover:bg-saffron-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onViewTree, onVillageUpdated }) {
  const [stats, setStats] = useState(null);
  const [pendingTrees, setPendingTrees] = useState([]);
  const [allTrees, setAllTrees] = useState([]);
  const [villagesList, setVillagesList] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => setToast({ message, type });

  const [newVillageName, setNewVillageName] = useState('');
  const [villageAdding, setVillageAdding] = useState(false);
  const [villageError, setVillageError] = useState(null);

  // In-website confirmation dialogs (replace window.confirm / window.prompt)
  const [villageDeleteTarget, setVillageDeleteTarget] = useState(null);
  const [deleteTreeTarget, setDeleteTreeTarget] = useState(null);
  const [securityKeyInput, setSecurityKeyInput] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await apiFetch('/admin/stats');
      setStats(statsRes);
      const pendingRes = await apiFetch('/admin/pending-trees');
      setPendingTrees(pendingRes);
      const allTreesRes = await apiFetch('/family/trees');
      setAllTrees(allTreesRes);
      const villagesRes = await apiFetch('/villages');
      setVillagesList(villagesRes);
    } catch (err) {
      showToast('Failed to load admin data. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateStatus = async (treeId, status) => {
    setActionLoading(treeId);
    try {
      await apiFetch(`/admin/trees/${treeId}/status`, { method: 'PUT', body: JSON.stringify({ status, admin_notes: '' }) });
      showToast(status === 'approved' ? 'Tree approved successfully!' : 'Tree rejected.', status === 'approved' ? 'success' : 'error');
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to update tree status.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddVillage = async (e) => {
    e.preventDefault();
    if (!newVillageName.trim()) return;
    setVillageAdding(true);
    setVillageError(null);
    try {
      await apiFetch('/villages', { method: 'POST', body: JSON.stringify({ name: newVillageName.trim() }) });
      const added = newVillageName.trim();
      setNewVillageName('');
      showToast(`Village '${added}' added successfully.`, 'success');
      await fetchData();
      if (onVillageUpdated) onVillageUpdated();
    } catch (err) {
      setVillageError(err.message || 'Failed to add village.');
    } finally {
      setVillageAdding(false);
    }
  };

  const handleConfirmVillageDelete = async () => {
    if (!villageDeleteTarget) return;
    const target = villageDeleteTarget;
    setVillageDeleteTarget(null);
    try {
      await apiFetch(`/villages/${target.id}`, { method: 'DELETE' });
      showToast(`Village '${target.name}' removed.`, 'success');
      await fetchData();
      if (onVillageUpdated) onVillageUpdated();
    } catch (err) {
      showToast(err.message || 'Failed to delete village.', 'error');
    }
  };

  const handleConfirmTreeDelete = async (e) => {
    e.preventDefault();
    if (!deleteTreeTarget || !securityKeyInput.trim()) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(
        `/admin/trees/${deleteTreeTarget.id}?security_key=${encodeURIComponent(securityKeyInput.trim())}`,
        { method: 'DELETE' }
      );
      showToast(`Tree '${deleteTreeTarget.family_name}' permanently deleted.`, 'success');
      setDeleteTreeTarget(null);
      setSecurityKeyInput('');
      await fetchData();
    } catch (err) {
      setDeleteError(err.message || 'Invalid Security Key. Deletion denied.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Village delete confirmation popup */}
      {villageDeleteTarget && (
        <ConfirmDialog
          title="Remove Village?"
          message={`Remove '${villageDeleteTarget.name}' from the official village list? This cannot be undone.`}
          confirmLabel="Yes, Remove"
          danger
          onConfirm={handleConfirmVillageDelete}
          onCancel={() => setVillageDeleteTarget(null)}
        />
      )}

      {/* Tree delete — security key popup */}
      {deleteTreeTarget && (
        <div className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-red-200 space-y-5 max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <button
              onClick={() => { setDeleteTreeTarget(null); setDeleteError(null); setSecurityKeyInput(''); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900">Admin Security Key Required</h3>
              <p className="text-xs text-slate-500">
                To permanently delete <strong className="text-slate-800">{deleteTreeTarget.family_name}</strong>, enter the Special Admin Security Key.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {deleteError}
              </div>
            )}

            <form onSubmit={handleConfirmTreeDelete} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Special Admin Security Key *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={securityKeyInput}
                    onChange={(e) => setSecurityKeyInput(e.target.value)}
                    placeholder="Enter security key..."
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setDeleteTreeTarget(null); setDeleteError(null); setSecurityKeyInput(''); }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-saffron-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-saffron-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" /> Admin Control Panel
          </div>
          <h2 className="font-serif text-3xl font-bold text-slate-900">
            Zazadiya Parivaar <span className="text-saffron-600">Admin Dashboard</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Review family trees, manage official village lists, and monitor community metrics.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="self-start sm:self-auto bg-saffron-50 hover:bg-saffron-100 text-saffron-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-saffron-200 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Approved Families', value: stats.total_families, icon: GitBranch },
            { label: 'Total Members', value: stats.total_members, icon: Users },
            { label: 'Official Villages', value: villagesList.length, icon: MapPin },
            { label: 'Pending Review', value: stats.pending_approvals, icon: Clock, highlight: true },
          ].map(({ label, value, icon: Icon, highlight }) => (
            <div key={label} className={`${highlight ? 'bg-amber-50 border-amber-200' : 'bg-white border-saffron-100'} rounded-2xl p-5 border shadow-sm flex items-center gap-4`}>
              <div className={`w-12 h-12 rounded-xl ${highlight ? 'bg-amber-500' : 'bg-saffron-500'} text-white flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-xs font-bold uppercase ${highlight ? 'text-amber-800' : 'text-slate-400'}`}>{label}</p>
                <h3 className={`font-serif text-2xl font-bold ${highlight ? 'text-amber-900' : 'text-slate-900'}`}>{value}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {[
          { id: 'pending', label: `Pending Approvals (${pendingTrees.length})`, icon: Clock },
          { id: 'all', label: `All Family Trees (${allTrees.length})`, icon: GitBranch },
          { id: 'villages', label: `Manage Villages (${villagesList.length})`, icon: Building2 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === id
                ? 'border-saffron-500 text-saffron-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" /><span>{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-saffron-200 border-t-saffron-500 rounded-full animate-spin mx-auto mb-3" />
          Loading admin data...
        </div>

      ) : activeTab === 'pending' ? (
        pendingTrees.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-slate-900">No Pending Submissions</h3>
            <p className="text-slate-500 text-sm">All family trees have been reviewed!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTrees.map((tree) => (
              <div key={tree.id} className="bg-white rounded-3xl p-6 border border-saffron-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                      Awaiting Verification
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(tree.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-slate-900">{tree.family_name}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span>Head: <strong className="text-slate-800">{tree.head_name}</strong></span>
                    <span>•</span>
                    <span>Village: <strong className="text-slate-800">{tree.village_name}</strong></span>
                    <span>•</span>
                    <span>Members: <strong className="text-saffron-700">{tree.members?.length || 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {(tree.members || []).slice(0, 6).map((m) => (
                      <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden bg-saffron-50 flex items-center justify-center text-sm">
                        {m.photo_url ? <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" /> : <span>{m.gender === 'Female' ? '👩' : '👨'}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => onViewTree(tree.id)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Inspect
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(tree.id, 'rejected')}
                    disabled={actionLoading === tree.id}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(tree.id, 'approved')}
                    disabled={actionLoading === tree.id}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50"
                  >
                    {actionLoading === tree.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )

      ) : activeTab === 'all' ? (
        allTrees.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <p className="text-slate-500 text-sm">No family trees found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allTrees.map((tree) => (
              <div key={tree.id} className="bg-white rounded-2xl p-5 border border-saffron-100 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                      tree.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      tree.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {tree.status}
                    </span>
                    <button
                      onClick={() => { setDeleteTreeTarget(tree); setDeleteError(null); setSecurityKeyInput(''); }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-slate-900 mt-2">{tree.family_name}</h4>
                  <p className="text-xs text-slate-500">Village: {tree.village_name} • Head: {tree.head_name}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {(tree.members || []).slice(0, 5).map((m) => (
                      <div key={m.id} className="w-7 h-7 rounded-full border-2 border-white shadow-sm overflow-hidden bg-saffron-50 flex items-center justify-center text-xs">
                        {m.photo_url ? <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" /> : <span>{m.gender === 'Female' ? '👩' : '👨'}</span>}
                      </div>
                    ))}
                    {(tree.members?.length || 0) > 5 && (
                      <span className="text-[10px] text-slate-400 font-bold ml-1">+{tree.members.length - 5}</span>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-saffron-700">{tree.members?.length || 0} Members</span>
                  <button
                    onClick={() => onViewTree(tree.id)}
                    className="flex items-center gap-1 bg-saffron-50 hover:bg-saffron-100 text-saffron-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )

      ) : (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-6 border border-saffron-200 shadow-sm space-y-4">
            <h3 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-saffron-600" /> Add Official Native Village
            </h3>
            {villageError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {villageError}
              </div>
            )}
            <form onSubmit={handleAddVillage} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Village Name *</label>
                <input
                  type="text"
                  value={newVillageName}
                  onChange={(e) => setNewVillageName(e.target.value)}
                  placeholder="e.g. Dhari, Jetpur, Una"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500"
                />
              </div>
              <button
                type="submit"
                disabled={villageAdding}
                className="bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {villageAdding ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {villageAdding ? 'Adding...' : 'Add Village'}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {villagesList.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl p-4 border border-saffron-100 shadow-sm flex items-center justify-between group hover:border-saffron-300 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{v.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {v.district ? `${v.district} District` : 'Gujarat'}
                    {v.member_count > 0 && <span className="ml-2 text-saffron-600 font-semibold">• {v.member_count} members</span>}
                  </p>
                </div>
                <button
                  onClick={() => setVillageDeleteTarget(v)}
                  className="p-2 text-slate-300 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove Village"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}