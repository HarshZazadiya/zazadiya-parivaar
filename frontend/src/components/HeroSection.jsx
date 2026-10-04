import React, { useState } from 'react';
import { Search, MapPin, Users, GitBranch, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function HeroSection({ villages = [], onExploreDirectory, onBuildTree, onExploreVillages, onSearch }) {
  const [heroSearchTerm, setHeroSearchTerm] = useState('');
  const villageCount = villages.length;

  const handleHeroSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(heroSearchTerm);
    }
  };

  return (
    <div className="relative overflow-hidden bg-hanuman-light border-b border-saffron-100 py-16 lg:py-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40">
        <div className="absolute -top-32 -left-20 w-96 h-96 bg-saffron-300/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-amber-300/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          <div className="inline-flex items-center gap-2 bg-saffron-100/90 text-saffron-800 px-4 py-2 rounded-full border border-saffron-200 shadow-sm">
            <span className="text-lg font-serif leading-none">ॐ</span>
            <span className="text-xs sm:text-sm font-bold tracking-wide">
              ઝાઝડીયા પરિવાર ડિજિટલ વંશાવલી પોર્ટલ ({villageCount} ગામ)
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
            Uniting <span className="text-gradient-saffron">Zazadiya Parivaar</span> Across Generations & Villages
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Welcome to the official Zazadiya Family directory and interactive family tree registry. Discover your roots, connect with over <strong className="text-saffron-700 font-bold">1500+ family members</strong> across <strong className="text-saffron-700 font-bold">{villageCount} native village{villageCount === 1 ? '' : 's'}</strong>, and build your family tree for future generations.
          </p>

          <form onSubmit={handleHeroSearchSubmit} className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center bg-white p-2 rounded-2xl shadow-saffron-glow border border-saffron-200">
              <Search className="w-6 h-6 text-saffron-500 ml-3 shrink-0" />
              <input
                type="text"
                value={heroSearchTerm}
                onChange={(e) => setHeroSearchTerm(e.target.value)}
                placeholder="Search member name, village (e.g. Savarkundla, Surat), business..."
                className="w-full px-4 py-3 text-slate-800 bg-transparent text-sm sm:text-base focus:outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all flex items-center gap-2 shrink-0 shadow-md"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onBuildTree}
              className="flex items-center gap-2 bg-gradient-to-r from-saffron-600 to-saffron-500 text-white px-7 py-3.5 rounded-2xl font-bold text-sm shadow-saffron-glow hover:scale-[1.02] transition-transform"
            >
              <GitBranch className="w-5 h-5" />
              <span>Build My Family Tree</span>
            </button>
            <button
              onClick={onExploreDirectory}
              className="flex items-center gap-2 bg-white text-saffron-700 border border-saffron-200 hover:bg-saffron-50 px-7 py-3.5 rounded-2xl font-bold text-sm shadow-sm transition-all"
            >
              <Users className="w-5 h-5" />
              <span>Explore Member Directory</span>
            </button>
            <button
              onClick={onExploreVillages}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all"
            >
              <MapPin className="w-5 h-5 text-saffron-500" />
              <span>{villageCount} Village{villageCount === 1 ? '' : 's'} Hub</span>
            </button>
          </div>

        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass-card p-6 rounded-2xl text-center border-t-4 border-t-saffron-500">
            <div className="w-12 h-12 bg-saffron-100 text-saffron-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-3xl font-bold text-slate-900">1,500+</h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Parivaar Members</p>
          </div>

          <div className="glass-card p-6 rounded-2xl text-center border-t-4 border-t-saffron-500">
            <div className="w-12 h-12 bg-saffron-100 text-saffron-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-3xl font-bold text-slate-900">{villageCount}</h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Native Villages</p>
          </div>

          <div className="glass-card p-6 rounded-2xl text-center border-t-4 border-t-saffron-500">
            <div className="w-12 h-12 bg-saffron-100 text-saffron-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <GitBranch className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-3xl font-bold text-slate-900">350+</h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Family Trees</p>
          </div>

          <div className="glass-card p-6 rounded-2xl text-center border-t-4 border-t-saffron-500">
            <div className="w-12 h-12 bg-saffron-100 text-saffron-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-3xl font-bold text-slate-900">100%</h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Admin Verified</p>
          </div>
        </div>

      </div>
    </div>
  );
}