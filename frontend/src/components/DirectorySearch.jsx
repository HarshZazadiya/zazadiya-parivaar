import React, { useState, useMemo } from 'react';
import { Search, Filter, MapPin, Briefcase, GraduationCap, Phone, Mail, Home, Eye, X, User, GitBranch } from 'lucide-react';

export default function DirectorySearch({
  members,
  villages,
  initialSearch = '',
  initialVillage = '',
  onViewTree
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedVillage, setSelectedVillage] = useState(initialVillage);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedEducation, setSelectedEducation] = useState('');
  const [activeMemberModal, setActiveMemberModal] = useState(null);

  // Extract unique business categories
  const businessList = useMemo(() => {
    const list = new Set();
    members.forEach((m) => {
      if (m.current_business) list.add(m.current_business);
    });
    return Array.from(list);
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !searchTerm ||
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.current_business?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.village_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.education?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.contact_number?.includes(searchTerm);

      const matchVillage =
        !selectedVillage ||
        m.village_name?.toLowerCase() === selectedVillage.toLowerCase();

      const matchBusiness =
        !selectedBusiness ||
        m.current_business?.toLowerCase().includes(selectedBusiness.toLowerCase());

      const matchEducation =
        !selectedEducation ||
        m.education?.toLowerCase().includes(selectedEducation.toLowerCase());

      return matchSearch && matchVillage && matchBusiness && matchEducation;
    });
  }, [members, searchTerm, selectedVillage, selectedBusiness, selectedEducation]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedVillage('');
    setSelectedBusiness('');
    setSelectedEducation('');
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Search & Filter Header Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-saffron-100 mb-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Zazadiya Parivaar <span className="text-saffron-600">Member Directory</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Search and filter across {members.length} registered family members in 22 villages.
            </p>
          </div>

          {(searchTerm || selectedVillage || selectedBusiness || selectedEducation) && (
            <button
              onClick={clearFilters}
              className="self-start md:self-auto text-xs font-bold text-saffron-600 bg-saffron-50 hover:bg-saffron-100 px-3 py-1.5 rounded-lg border border-saffron-200 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Text Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500 focus:bg-white"
            />
          </div>

          {/* Village Filter */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-saffron-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500 focus:bg-white appearance-none cursor-pointer"
            >
              <option value="">All 22 Villages</option>
              {villages.map((v) => (
                <option key={v.id || v.name} value={v.name}>
                  {v.name} ({v.district})
                </option>
              ))}
            </select>
          </div>

          {/* Business / Occupation Filter */}
          <div className="relative">
            <Briefcase className="w-4 h-4 text-saffron-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              placeholder="Filter business (e.g. Diamond, Agriculture)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500 focus:bg-white"
            />
          </div>

          {/* Education Filter */}
          <div className="relative">
            <GraduationCap className="w-4 h-4 text-saffron-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={selectedEducation}
              onChange={(e) => setSelectedEducation(e.target.value)}
              placeholder="Filter education (e.g. B.Tech, CA)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500 focus:bg-white"
            />
          </div>

        </div>
      </div>

      {/* Member Directory Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <div className="w-16 h-16 bg-saffron-50 text-saffron-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🔍
          </div>
          <h3 className="font-serif text-xl font-bold text-slate-800">No Family Members Found</h3>
          <p className="text-slate-500 text-sm mt-1">Try relaxing your search terms or village filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-5 border border-saffron-100 shadow-sm hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-saffron-500 to-saffron-400 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {m.gender === 'Female' ? '👩' : '👨'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight">
                        {m.full_name}
                      </h4>
                      <span className="inline-block mt-0.5 text-xs font-semibold text-saffron-700 bg-saffron-50 px-2 py-0.5 rounded-md border border-saffron-100">
                        {m.relationship}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details List */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-saffron-500 shrink-0" />
                    <span className="font-medium">Village:</span>
                    <span className="font-semibold text-slate-800">{m.village_name}</span>
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

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveMemberModal(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-saffron-50 hover:bg-saffron-100 text-saffron-800 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <button
                  onClick={() => onViewTree(m.tree_id)}
                  className="flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5 text-saffron-600" />
                  <span>Tree</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Details Modal */}
      {activeMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-saffron-100 space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveMemberModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-saffron-500 to-saffron-400 text-white flex items-center justify-center text-3xl shadow-saffron-glow">
                {activeMemberModal.gender === 'Female' ? '👩' : '👨'}
              </div>
              <div>
                <span className="text-xs font-bold bg-saffron-100 text-saffron-800 px-2.5 py-0.5 rounded-full uppercase">
                  {activeMemberModal.relationship}
                </span>
                <h3 className="font-serif text-xl font-bold text-slate-900 mt-1">
                  {activeMemberModal.full_name}
                </h3>
                <p className="text-xs text-slate-500">Native Village: {activeMemberModal.village_name}</p>
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

            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  const tid = activeMemberModal.tree_id;
                  setActiveMemberModal(null);
                  onViewTree(tid);
                }}
                className="w-full bg-saffron-500 hover:bg-saffron-600 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <GitBranch className="w-4 h-4" />
                <span>View Full Family Tree</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
