import React, { useState } from 'react';
import { Plus, Trash2, UserPlus, Save, CheckCircle, ShieldAlert, GitBranch, Sparkles, MapPin } from 'lucide-react';
import { apiFetch, getAuthToken } from '../utils/api';

export default function TreeBuilder({ villages, onSuccess, onOpenAuth }) {
  const token = getAuthToken();

  const [familyName, setFamilyName] = useState('');
  const [headName, setHeadName] = useState('');
  const [mainVillage, setMainVillage] = useState('Savarkundla');
  const [customVillage, setCustomVillage] = useState('');
  
  const [members, setMembers] = useState([
    {
      id: 1,
      full_name: '',
      gender: 'Male',
      relationship: 'Head',
      date_of_birth: '',
      village_name: 'Savarkundla',
      current_address: '',
      education: '',
      current_business: '',
      business_address: '',
      email_address: '',
      contact_number: '',
      parent_member_id: null
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const selectedVillageName = mainVillage === 'OTHER' ? customVillage : mainVillage;

  const handleAddRelative = (relationType) => {
    let gender = 'Male';
    if (relationType === 'Spouse') gender = 'Female';
    if (relationType === 'Child' || relationType === 'Sibling') gender = 'Male';
    if (relationType === 'Parent') gender = 'Male';

    const newMember = {
      id: Date.now(),
      full_name: '',
      gender: gender,
      relationship: relationType,
      date_of_birth: '',
      village_name: selectedVillageName || 'Savarkundla',
      current_address: '',
      education: '',
      current_business: '',
      business_address: '',
      email_address: '',
      contact_number: '',
      parent_member_id: relationType === 'Child' ? 1 : null
    };

    setMembers([...members, newMember]);
  };

  const handleUpdateMember = (id, field, value) => {
    setMembers(
      members.map((m) => {
        if (m.id === id) {
          const updated = { ...m, [field]: value };
          if (field === 'full_name' && m.relationship === 'Head') {
            setHeadName(value);
            if (!familyName) setFamilyName(`${value} Family`);
          }
          return updated;
        }
        return m;
      })
    );
  };

  const handleRemoveMember = (id) => {
    if (members.length <= 1) {
      alert("Family tree must have at least the Head of Family.");
      return;
    }
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleSubmitTree = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      onOpenAuth();
      return;
    }

    const head = members.find((m) => m.relationship === 'Head');
    if (!head || !head.full_name.trim()) {
      setError("Please fill in the Head of Family name.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        family_name: familyName || `${head.full_name} Family`,
        head_name: head.full_name,
        village_name: selectedVillageName,
        members: members.map((m) => ({
          ...m,
          village_name: m.village_name || selectedVillageName
        }))
      };

      await apiFetch('/family/trees', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSubmittedSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Failed to submit family tree.");
    } finally {
      setLoading(false);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-white rounded-3xl border border-saffron-200 shadow-xl text-center space-y-5">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✓
        </div>
        <h2 className="font-serif text-3xl font-bold text-slate-900">
          Family Tree Submitted Successfully!
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
          Jai Shree Ram! Your family tree for <strong className="text-saffron-700">{familyName}</strong> has been submitted to the Zazadiya Parivaar admin team for review & verification. Once approved, it will be visible in the public directory for all family members.
        </p>
        <div className="pt-4">
          <button
            onClick={() => {
              setSubmittedSuccess(false);
              setMembers([{
                id: 1,
                full_name: '',
                gender: 'Male',
                relationship: 'Head',
                date_of_birth: '',
                village_name: 'Savarkundla',
                current_address: '',
                education: '',
                current_business: '',
                business_address: '',
                email_address: '',
                contact_number: '',
                parent_member_id: null
              }]);
            }}
            className="bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-colors"
          >
            Create Another Family Tree
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 bg-saffron-100 text-saffron-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          <GitBranch className="w-4 h-4" /> Family Tree Registry
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          Build Your <span className="text-saffron-600">Zazadiya Family Tree</span>
        </h2>
        <p className="text-slate-600 text-sm mt-1">
          Add yourself, parents, partner, siblings, and children. Detail your native village, business, address, and contact info.
        </p>
      </div>

      {!token && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
            <p className="text-xs sm:text-sm text-amber-900 font-medium">
              You are building tree as a guest. Please log in or register before submitting to save your tree.
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0"
          >
            Log In Now
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmitTree} className="space-y-8">
        
        {/* Step 1: Overall Family Info */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-saffron-100 space-y-6">
          <h3 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-8 h-8 rounded-lg bg-saffron-500 text-white text-sm font-bold flex items-center justify-center">1</span>
            General Family Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Family Tree Title *
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. Ramnikbhai Mansukhbhai Zazadiya Family"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Main Native Village *
              </label>
              <select
                value={mainVillage}
                onChange={(e) => setMainVillage(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500 focus:bg-white cursor-pointer"
              >
                {villages.map((v) => (
                  <option key={v.id || v.name} value={v.name}>
                    {v.name} ({v.district})
                  </option>
                ))}
                <option value="OTHER">Other / Custom Village</option>
              </select>
            </div>

            {mainVillage === 'OTHER' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Custom Village Name *
                </label>
                <input
                  type="text"
                  value={customVillage}
                  onChange={(e) => setCustomVillage(e.target.value)}
                  placeholder="Enter custom village name"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Member Entries */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-saffron-500 text-white text-sm font-bold flex items-center justify-center">2</span>
              Family Members ({members.length})
            </h3>

            {/* Quick Add Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddRelative('Parent')}
                className="flex items-center gap-1 bg-saffron-50 hover:bg-saffron-100 text-saffron-800 text-xs font-bold px-3 py-2 rounded-xl border border-saffron-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add Parent
              </button>
              <button
                type="button"
                onClick={() => handleAddRelative('Spouse')}
                className="flex items-center gap-1 bg-saffron-50 hover:bg-saffron-100 text-saffron-800 text-xs font-bold px-3 py-2 rounded-xl border border-saffron-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add Spouse/Partner
              </button>
              <button
                type="button"
                onClick={() => handleAddRelative('Sibling')}
                className="flex items-center gap-1 bg-saffron-50 hover:bg-saffron-100 text-saffron-800 text-xs font-bold px-3 py-2 rounded-xl border border-saffron-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add Sibling
              </button>
              <button
                type="button"
                onClick={() => handleAddRelative('Child')}
                className="flex items-center gap-1 bg-saffron-50 hover:bg-saffron-100 text-saffron-800 text-xs font-bold px-3 py-2 rounded-xl border border-saffron-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add Child
              </button>
            </div>
          </div>

          {/* Member Card Forms */}
          {members.map((member, index) => (
            <div
              key={member.id}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-saffron-100 relative space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white font-bold flex items-center justify-center text-lg">
                    {member.gender === 'Female' ? '👩' : '👨'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">
                      {member.full_name || `Member #${index + 1}`}
                    </h4>
                    <span className="text-xs font-bold text-saffron-700 bg-saffron-50 px-2.5 py-0.5 rounded-full uppercase">
                      Relation: {member.relationship}
                    </span>
                  </div>
                </div>

                {member.relationship !== 'Head' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                    title="Remove Member"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={member.full_name}
                    onChange={(e) => handleUpdateMember(member.id, 'full_name', e.target.value)}
                    placeholder="e.g. Ramnikbhai Mansukhbhai Zazadiya"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500"
                  />
                </div>

                {/* Relationship */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Relationship *
                  </label>
                  <select
                    value={member.relationship}
                    onChange={(e) => handleUpdateMember(member.id, 'relationship', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500"
                  >
                    <option value="Head">Head (Self)</option>
                    <option value="Parent">Parent (Father / Mother)</option>
                    <option value="Spouse">Spouse / Partner</option>
                    <option value="Sibling">Sibling (Brother / Sister)</option>
                    <option value="Child">Child (Son / Daughter)</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Gender *
                  </label>
                  <select
                    value={member.gender}
                    onChange={(e) => handleUpdateMember(member.id, 'gender', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={member.date_of_birth}
                    onChange={(e) => handleUpdateMember(member.id, 'date_of_birth', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500"
                  />
                </div>

                {/* Village Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Village Name *
                  </label>
                  <input
                    type="text"
                    value={member.village_name}
                    onChange={(e) => handleUpdateMember(member.id, 'village_name', e.target.value)}
                    placeholder="e.g. Savarkundla"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Contact / Phone Number
                  </label>
                  <input
                    type="tel"
                    value={member.contact_number}
                    onChange={(e) => handleUpdateMember(member.id, 'contact_number', e.target.value)}
                    placeholder="e.g. +91 9925012345"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={member.email_address}
                    onChange={(e) => handleUpdateMember(member.id, 'email_address', e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500"
                  />
                </div>

                {/* Education */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Education
                  </label>
                  <input
                    type="text"
                    value={member.education}
                    onChange={(e) => handleUpdateMember(member.id, 'education', e.target.value)}
                    placeholder="e.g. B.Tech, B.Com, CA, MD Doctor"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500"
                  />
                </div>

                {/* Current Business */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Current Business / Occupation
                  </label>
                  <input
                    type="text"
                    value={member.current_business}
                    onChange={(e) => handleUpdateMember(member.id, 'current_business', e.target.value)}
                    placeholder="e.g. Diamond Trading, Agriculture, IT"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500"
                  />
                </div>

                {/* Current Home Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Current Address
                  </label>
                  <input
                    type="text"
                    value={member.current_address}
                    onChange={(e) => handleUpdateMember(member.id, 'current_address', e.target.value)}
                    placeholder="e.g. Varachha Road, Surat, Gujarat"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500"
                  />
                </div>

                {/* Business Address */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Business Address
                  </label>
                  <input
                    type="text"
                    value={member.business_address}
                    onChange={(e) => handleUpdateMember(member.id, 'business_address', e.target.value)}
                    placeholder="Office / Shop location"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500"
                  />
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Live Tree Preview */}
        <div className="bg-gradient-to-br from-saffron-50 to-amber-50 rounded-3xl p-6 border border-saffron-200 space-y-4">
          <h4 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-saffron-600" />
            Live Family Tree Visual Preview
          </h4>

          <div className="flex flex-wrap items-center justify-center gap-4 py-4">
            {members.map((m) => (
              <div
                key={m.id}
                className="bg-white p-3 rounded-2xl border border-saffron-200 shadow-sm text-center w-44 relative"
              >
                <div className="w-8 h-8 rounded-full bg-saffron-500 text-white font-bold text-xs flex items-center justify-center mx-auto mb-1">
                  {m.gender === 'Female' ? '👩' : '👨'}
                </div>
                <p className="font-bold text-slate-900 text-xs truncate">
                  {m.full_name || 'Member Name'}
                </p>
                <p className="text-[10px] text-saffron-700 font-semibold uppercase">
                  {m.relationship}
                </p>
                <p className="text-[10px] text-slate-500">
                  {m.village_name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-saffron-600 to-saffron-500 text-white font-bold px-10 py-4 rounded-2xl shadow-saffron-glow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Submitting Family Tree...' : 'Submit Family Tree to Admin'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
