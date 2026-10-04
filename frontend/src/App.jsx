import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import VillagesGrid from './components/VillagesGrid';
import DirectorySearch from './components/DirectorySearch';
import TreeBuilder from './components/TreeBuilder';
import TreeViewModal from './components/TreeViewModal';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import { apiFetch, getCurrentUser } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [villages, setVillages] = useState([]);
  const [members, setMembers] = useState([]);
  const [trees, setTrees] = useState([]);
  const [activeTreeModal, setActiveTreeModal] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Initial Data Fetch
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const vData = await apiFetch('/villages').catch(() => []);
      setVillages(vData);

      const mData = await apiFetch('/family/members/search').catch(() => []);
      setMembers(mData);

      const tData = await apiFetch('/family/trees').catch(() => []);
      setTrees(tData);
    } catch (err) {
      console.warn("Failed to connect to backend, running with initial local state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleInspectTree = async (treeId) => {
    try {
      const t = await apiFetch(`/family/trees/${treeId}`);
      setActiveTreeModal(t);
    } catch (err) {
      // Fallback find in local state
      const localT = trees.find((item) => item.id === treeId);
      if (localT) {
        setActiveTreeModal(localT);
      } else {
        alert("Unable to load family tree details.");
      }
    }
  };

  const handleVillageClick = (vName) => {
    setSelectedVillageFilter(vName);
    setActiveTab('directory');
  };

  const handleHeroSearch = (query) => {
    setSearchQuery(query);
    setActiveTab('directory');
  };

  return (
    <div className="min-h-screen flex flex-col bg-saffron-50/40 text-slate-800">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <HeroSection
              onExploreDirectory={() => setActiveTab('directory')}
              onBuildTree={() => setActiveTab('builder')}
              onExploreVillages={() => setActiveTab('villages')}
              onSearch={handleHeroSearch}
            />
            
            <VillagesGrid
              villages={villages}
              onSelectVillage={handleVillageClick}
            />
          </>
        )}

        {activeTab === 'villages' && (
          <VillagesGrid
            villages={villages}
            onSelectVillage={handleVillageClick}
          />
        )}

        {activeTab === 'directory' && (
          <DirectorySearch
            members={members}
            villages={villages}
            initialSearch={searchQuery}
            initialVillage={selectedVillageFilter}
            onViewTree={handleInspectTree}
          />
        )}

        {activeTab === 'builder' && (
          <TreeBuilder
            villages={villages}
            onSuccess={() => {
              loadInitialData();
              setActiveTab('directory');
            }}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            onViewTree={handleInspectTree}
          />
        )}
      </main>

      {/* Tree Viewer Modal */}
      {activeTreeModal && (
        <TreeViewModal
          tree={activeTreeModal}
          onClose={() => setActiveTreeModal(null)}
        />
      )}

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => loadInitialData()}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t-4 border-t-saffron-500 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-saffron-500 text-white flex items-center justify-center text-2xl">
                🚩
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-white">Zazadiya Parivaar</h3>
                <p className="text-xs text-saffron-400 font-semibold tracking-wider uppercase">
                  || શ્રી ગદાધારી હનુમાનજી પ્રસન્ન ||
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-md">
              Connecting 1500+ Zazadiya family members across 22 native villages in Gujarat & India. Preserving family heritage and genealogy for future generations.
            </p>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Zazadiya Parivaar Trust. All Rights Reserved.</p>
            <p className="text-yellow-400 font-serif">
              Jai Shree Ram • Lord Hanumanji Blessings
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
