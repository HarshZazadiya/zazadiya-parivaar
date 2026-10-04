import React, { useState } from 'react';
import { X, GitBranch, MapPin, Briefcase, GraduationCap, Phone, Mail, Home, User, Printer } from 'lucide-react';

export default function TreeViewModal({ tree, onClose }) {
  const [selectedMember, setSelectedMember] = useState(null);

  if (!tree) return null;

  const members = tree.members || [];
  const head = members.find((m) => m.relationship === 'Head') || members[0];
  const parents = members.filter((m) => m.relationship === 'Parent');
  const spouse = members.filter((m) => m.relationship === 'Spouse');
  const siblings = members.filter((m) => m.relationship === 'Sibling');
  const children = members.filter((m) => m.relationship === 'Child');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative border border-saffron-200 my-auto space-y-6 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🚩</span>
              <span className="text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 px-2.5 py-0.5 rounded-full border border-saffron-200">
                Zazadiya Parivaar Tree
              </span>
              {tree.status && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  tree.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {tree.status}
                </span>
              )}
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              {tree.family_name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4 text-saffron-500" />
              <span>Native Village: <strong className="text-slate-800">{tree.village_name}</strong></span>
              <span>•</span>
              <span>Head of Family: <strong className="text-slate-800">{tree.head_name}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-500 hover:text-saffron-600 rounded-xl hover:bg-saffron-50 border border-slate-200"
              title="Print Family Tree"
            >
              <Printer className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tree Interactive Hierarchical Graph */}
        <div className="py-6 px-4 bg-gradient-to-b from-saffron-50/60 to-amber-50/40 rounded-3xl border border-saffron-100 space-y-10">
          
          {/* Generation 1: Parents / Grandparents */}
          {parents.length > 0 && (
            <div className="space-y-3">
              <p className="text-center text-xs font-bold text-saffron-800 uppercase tracking-widest">
                — Generation 1: Parents & Ancestors —
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {parents.map((m) => (
                  <MemberNode
                    key={m.id}
                    member={m}
                    onSelect={() => setSelectedMember(m)}
                  />
                ))}
              </div>
              <div className="w-0.5 h-6 bg-saffron-300 mx-auto" />
            </div>
          )}

          {/* Generation 2: Head, Spouse & Siblings */}
          <div className="space-y-3">
            <p className="text-center text-xs font-bold text-saffron-800 uppercase tracking-widest">
              — Generation 2: Head of Family & Spouse —
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {head && (
                <MemberNode
                  member={head}
                  isHead
                  onSelect={() => setSelectedMember(head)}
                />
              )}
              {spouse.map((m) => (
                <MemberNode
                  key={m.id}
                  member={m}
                  onSelect={() => setSelectedMember(m)}
                />
              ))}
              {siblings.map((m) => (
                <MemberNode
                  key={m.id}
                  member={m}
                  onSelect={() => setSelectedMember(m)}
                />
              ))}
            </div>
            {children.length > 0 && <div className="w-0.5 h-6 bg-saffron-300 mx-auto" />}
          </div>

          {/* Generation 3: Children */}
          {children.length > 0 && (
            <div className="space-y-3">
              <p className="text-center text-xs font-bold text-saffron-800 uppercase tracking-widest">
                — Generation 3: Children & Descendants —
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {children.map((m) => (
                  <MemberNode
                    key={m.id}
                    member={m}
                    onSelect={() => setSelectedMember(m)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Selected Member Details Drawer Card */}
        {selectedMember && (
          <div className="p-5 bg-white rounded-2xl border-2 border-saffron-300 shadow-lg relative space-y-3 animate-in fade-in">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white font-bold flex items-center justify-center text-lg">
                {selectedMember.gender === 'Female' ? '👩' : '👨'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">{selectedMember.full_name}</h4>
                <p className="text-xs text-saffron-700 font-semibold">{selectedMember.relationship} • {selectedMember.village_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-700 pt-2 border-t border-slate-100">
              <div>
                <p className="text-slate-400 font-medium">Date of Birth</p>
                <p className="font-bold">{selectedMember.date_of_birth || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Business / Occupation</p>
                <p className="font-bold">{selectedMember.current_business || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Education</p>
                <p className="font-bold">{selectedMember.education || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Contact Number</p>
                <p className="font-bold text-saffron-700">{selectedMember.contact_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Email Address</p>
                <p className="font-bold">{selectedMember.email_address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Current Address</p>
                <p className="font-bold">{selectedMember.current_address || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function MemberNode({ member, isHead, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 text-center w-52 border ${
        isHead
          ? 'bg-gradient-to-br from-saffron-500 to-saffron-600 text-white shadow-saffron-glow border-saffron-600 scale-105'
          : 'bg-white text-slate-800 border-saffron-200 hover:border-saffron-400 shadow-sm hover:shadow-md'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center font-bold text-lg ${
        isHead ? 'bg-white text-saffron-600' : 'bg-saffron-50 text-saffron-600'
      }`}>
        {member.gender === 'Female' ? '👩' : '👨'}
      </div>

      <h5 className={`font-bold text-sm leading-tight truncate ${isHead ? 'text-white' : 'text-slate-900'}`}>
        {member.full_name}
      </h5>

      <p className={`text-xs font-semibold mt-1 uppercase ${isHead ? 'text-yellow-200' : 'text-saffron-700'}`}>
        {member.relationship}
      </p>

      {member.current_business && (
        <p className={`text-[10px] mt-1 line-clamp-1 ${isHead ? 'text-saffron-100' : 'text-slate-500'}`}>
          💼 {member.current_business}
        </p>
      )}
    </div>
  );
}
