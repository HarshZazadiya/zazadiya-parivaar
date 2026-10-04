import React from 'react';
import { MapPin, Users, GitBranch, ArrowUpRight } from 'lucide-react';

export default function VillagesGrid({ villages, onSelectVillage }) {
  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 bg-saffron-100 text-saffron-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <MapPin className="w-4 h-4" /> 22 Native Villages (૨૨ ગામ)
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          Root Villages of <span className="text-saffron-600">Zazadiya Parivaar</span>
        </h2>
        <p className="text-slate-600 text-sm sm:text-base mt-2">
          Explore family members and active family trees residing across our 22 native villages in Saurashtra, Gujarat & India.
        </p>
      </div>

      {/* Grid of Villages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {villages.map((v) => (
          <div
            key={v.id || v.name}
            onClick={() => onSelectVillage(v.name)}
            className="group bg-white rounded-2xl p-5 border border-saffron-100 shadow-sm hover:shadow-card-hover hover:border-saffron-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-saffron-50 text-saffron-600 flex items-center justify-center font-bold text-lg group-hover:bg-saffron-500 group-hover:text-white transition-colors">
                  🚩
                </div>
                <span className="text-xs font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md border border-amber-200">
                  {v.district} District
                </span>
              </div>

              <h3 className="font-serif text-xl font-bold text-slate-900 mt-4 group-hover:text-saffron-600 transition-colors">
                {v.name}
              </h3>
              
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {v.description || `Native village of Zazadiya family community in ${v.district}.`}
              </p>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-saffron-500" />
                  {v.member_count || 0} Members
                </span>
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5 text-saffron-500" />
                  {v.tree_count || 0} Trees
                </span>
              </div>
              
              <div className="w-8 h-8 rounded-full bg-saffron-50 text-saffron-600 flex items-center justify-center group-hover:bg-saffron-500 group-hover:text-white transition-all">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
