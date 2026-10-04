import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Users, GitBranch, MapPin, Clock, Eye, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function AdminDashboard({ onViewTree }) {
  const [stats, setStats] = useState(null);
  const [pendingTrees, setPendingTrees] = useState([]);
  const [allTrees, setAllTrees] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await apiFetch('/admin/stats');
      setStats(statsRes);

      const pendingRes = await apiFetch('/admin/pending-trees');
      setPendingTrees(pendingRes);

      const allTreesRes = await apiFetch('/family/trees?status=all');
      setAllTrees(allTreesRes);
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (treeId, status, notes = '') => {
    setActionLoading(treeId);
    try {
      await apiFetch(`/admin/trees/${treeId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, admin_notes: notes }),
      });
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update tree status.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-saffron-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-saffron-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" /> Admin Control Panel
          </div>
          <h2 className="font-serif text-3xl font-bold text-slate-900">
            Zazadiya Parivaar <span className="text-saffron-600">Admin Dashboard</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Review and approve family tree submissions, monitor directory statistics, and manage member trees.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="self-start sm:self-auto bg-saffron-50 hover:bg-saffron-100 text-saffron-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-saffron-200"
        >
          Refresh Dashboard Data
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-saffron-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-saffron-500 text-white flex items-center justify-center font-bold text-xl">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Approved Families</p>
              <h3 className="font-serif text-2xl font-bold text-slate-900">{stats.total_families}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-saffron-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-saffron-500 text-white flex items-center justify-center font-bold text-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Total Members</p>
              <h3 className="font-serif text-2xl font-bold text-slate-900">{stats.total_members}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-saffron-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-saffron-500 text-white flex items-center justify-center font-bold text-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Villages Represented</p>
              <h3 className="font-serif text-2xl font-bold text-slate-900">{stats.total_villages}</h3>
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-amber-800">Pending Review</p>
              <h3 className="font-serif text-2xl font-bold text-amber-900">{stats.pending_approvals}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-saffron-500 text-saffron-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals ({pendingTrees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-saffron-500 text-saffron-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>All Family Trees ({allTrees.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500">
          Loading dashboard records...
        </div>
      ) : activeTab === 'pending' ? (
        pendingTrees.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="font-serif text-xl font-bold text-slate-900">No Pending Submissions</h3>
            <p className="text-slate-500 text-sm">All family trees have been reviewed and approved!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTrees.map((tree) => (
              <div
                key={tree.id}
                className="bg-white rounded-3xl p-6 border border-saffron-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                      Awaiting Verification
                    </span>
                    <span className="text-xs text-slate-400">
                      Submitted on: {new Date(tree.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-slate-900">
                    {tree.family_name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span>Head: <strong className="text-slate-800">{tree.head_name}</strong></span>
                    <span>•</span>
                    <span>Village: <strong className="text-slate-800">{tree.village_name}</strong></span>
                    <span>•</span>
                    <span>Members Count: <strong className="text-saffron-700 font-bold">{tree.members?.length || 0}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => onViewTree(tree.id)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Tree</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(tree.id, 'rejected')}
                    disabled={actionLoading === tree.id}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(tree.id, 'approved')}
                    disabled={actionLoading === tree.id}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Tree</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allTrees.map((tree) => (
            <div
              key={tree.id}
              className="bg-white rounded-2xl p-5 border border-saffron-100 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                    tree.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {tree.status}
                  </span>
                  <h4 className="font-serif text-lg font-bold text-slate-900 mt-2">{tree.family_name}</h4>
                  <p className="text-xs text-slate-500">Village: {tree.village_name}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-saffron-700">{tree.members?.length || 0} Members</span>
                <button
                  onClick={() => onViewTree(tree.id)}
                  className="flex items-center gap-1 bg-saffron-50 hover:bg-saffron-100 text-saffron-800 px-3 py-1.5 rounded-xl text-xs font-bold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
