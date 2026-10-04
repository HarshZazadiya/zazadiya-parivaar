import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Briefcase, GraduationCap, Phone, Mail, Home, Eye, X, User, GitBranch, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function DirectorySearch({
  members: initialMembers = [],
  villages = [],
  initialSearch = '',
  initialVillage = '',
  onViewTree
}) {
  const [members, setMembers] = useState(initialMembers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedVillage, setSelectedVillage] = useState(initialVillage);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedEducation, setSelectedEducation] = useState('');

  const [activeMemberModal, setActiveMemberModal] = useState(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.append('q', searchTerm.trim());
        if (selectedVillage.trim()) params.append('village_name', selectedVillage.trim());
        if (selectedBusiness.trim()) params.append('business', selectedBusiness.trim());
        if (selectedEducation.trim()) params.append('education', selectedEducation.trim());
        params.append('limit', '500');

        const data = await apiFetch(`/family/members/search?${params.toString()}`);
        if (!cancelled) {
          setMembers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load members.');
          setMembers(initialMembers);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedVillage, selectedBusiness, selectedEducation, refreshNonce]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedVillage('');
    setSelectedBusiness('');
    setSelectedEducation('');
  };

  const handleRefresh = () => setRefreshNonce((n) => n + 1);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(selectedVillage) ||
    Boolean(selectedBusiness) ||
    Boolean(selectedEducation);

  return (
    <div className="py-6 sm:py-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-saffron-100 mb-6 sm:mb-8 space-y-4 sm:space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
              Zazadiya Parivaar <span className="text-saffron-600">Member Directory</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {loading
                ? 'Searching…'
                : <>Showing <strong className="text-saffron-700">{members.length}</strong> member{members.length === 1 ? '' : 's'} across all approved family trees.</>}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh directory"
              className="text-xs font-bold text-saffron-700 bg-saffron-50 hover:bg-saffron-100 px-3 py-1.5 rounded-lg border border-saffron-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500 focus:bg-white"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-saffron-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500 focus:bg-white appearance-none cursor-pointer"
            >
              <option value="">All {villages.length} Village{villages.length === 1 ? '' : 's'}</option>
              {villages.map((v) => (
                <option key={v.id || v.name} value={v.name}>
                  {v.name}{v.district ? ` (${v.district})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Briefcase className="w-4 h-4 text-saffron-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              placeholder="Filter business (e.g. Diamond)…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500 focus:bg-white"
            />
          </div>

          <div className="relative">
            <GraduationCap className="w-4 h-4 text-saffron-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={selectedEducation}
              onChange={(e) => setSelectedEducation(e.target.value)}
              placeholder="Filter education (e.g. B.Tech)…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {loading && members.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <div className="w-8 h-8 border-4 border-saffron-200 border-t-saffron-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading members…</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <div className="w-16 h-16 bg-saffron-50 text-saffron-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🔍
          </div>
          <h3 className="font-serif text-xl font-bold text-slate-800">No Family Members Found</h3>
          <p className="text-slate-500 text-sm mt-1">
            {hasActiveFilters
              ? 'Try relaxing your search terms or village filters.'
              : 'No approved members yet. Approved family trees will show up here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {members.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-saffron-100 shadow-sm hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-saffron-500 to-saffron-400 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0 overflow-hidden">
                      {m.photo_url ? (
                        <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{m.gender === 'Female' ? '👩' : '👨'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                        {m.full_name}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-saffron-500 shrink-0" />
                    <span className="font-medium">Village:</span>
                    <span className="font-semibold text-slate-800 truncate">{m.village_name}</span>
                  </div>

                  {m.current_business && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-saffron-500 shrink-0" />
                      <span className="font-medium">Business:</span>
                      <span className="font-semibold text-slate-800 line-clamp-1">{m.current_business}</span>
                    </div>
                  )}

                  {m.education && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-saffron-500 shrink-0" />
                      <span className="font-medium">Education:</span>
                      <span className="font-semibold text-slate-800 line-clamp-1">{m.education}</span>
                    </div>
                  )}

                  {m.contact_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-saffron-500 shrink-0" />
                      <span className="font-medium">Contact:</span>
                      <span className="font-semibold text-slate-800">{m.contact_number}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setActiveMemberModal(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-saffron-50 hover:bg-saffron-100 text-saffron-800 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                {m.tree_id && (
                  <button
                    onClick={() => onViewTree && onViewTree(m.tree_id)}
                    className="flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-saffron-600" />
                    <span>Tree</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative border border-saffron-100 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveMemberModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-saffron-500 to-saffron-400 text-white flex items-center justify-center text-3xl shadow-saffron-glow overflow-hidden shrink-0">
                {activeMemberModal.photo_url ? (
                  <img src={activeMemberModal.photo_url} alt={activeMemberModal.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{activeMemberModal.gender === 'Female' ? '👩' : '👨'}</span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-xl font-bold text-slate-900 mt-1 truncate">
                  {activeMemberModal.full_name}
                </h3>
                <p className="text-xs text-slate-500 truncate">Native Village: {activeMemberModal.village_name}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-saffron-50/60 p-3 rounded-2xl border border-saffron-100">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Date of Birth</p>
                  <p className="font-semibold text-slate-800">{activeMemberModal.date_of_birth || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Gender</p>
                  <p className="font-semibold text-slate-800">{activeMemberModal.gender}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-saffron-500" /> Current Address
                </p>
                <p className="font-medium text-slate-800 mt-0.5">{activeMemberModal.current_address || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-saffron-500" /> Current Business / Occupation
                </p>
                <p className="font-semibold text-slate-900 mt-0.5">{activeMemberModal.current_business || 'N/A'}</p>
              </div>

              {activeMemberModal.business_address && (
                <div>
                  <p className="text-xs text-slate-500 font-medium">Business Address</p>
                  <p className="font-medium text-slate-800 mt-0.5">{activeMemberModal.business_address}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-saffron-500" /> Education
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">{activeMemberModal.education || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                {activeMemberModal.contact_number && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-saffron-500" /> Phone Number
                    </p>
                    <p className="font-bold text-saffron-700">{activeMemberModal.contact_number}</p>
                  </div>
                )}

                {activeMemberModal.email_address && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-saffron-500" /> Email
                    </p>
                    <p className="font-semibold text-slate-800 truncate">{activeMemberModal.email_address}</p>
                  </div>
                )}
              </div>
            </div>

            {activeMemberModal.tree_id && (
              <div className="pt-4">
                <button
                  onClick={() => {
                    const tid = activeMemberModal.tree_id;
                    setActiveMemberModal(null);
                    if (onViewTree) onViewTree(tid);
                  }}
                  className="w-full bg-saffron-500 hover:bg-saffron-600 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <GitBranch className="w-4 h-4" />
                  <span>View Full Family Tree</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}