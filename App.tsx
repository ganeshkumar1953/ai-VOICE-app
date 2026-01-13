
import React, { useState } from 'react';
import { AppTab } from './types';
import LiveConversation from './components/LiveConversation';
import SearchAssistant from './components/SearchAssistant';
import ThinkingView from './components/ThinkingView';
import TranscriptionView from './components/TranscriptionView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.LIVE);
  const [neighborName] = useState('Guru');

  const renderContent = () => {
    return (
      <div className="animate-in fade-in zoom-in duration-500 w-full flex justify-center">
        {(() => {
          switch (activeTab) {
            case AppTab.LIVE: return <LiveConversation wakeName={neighborName} />;
            case AppTab.SEARCH: return <SearchAssistant />;
            case AppTab.THINKING: return <ThinkingView />;
            case AppTab.TRANSCRIPTION: return <TranscriptionView />;
            default: return <LiveConversation wakeName={neighborName} />;
          }
        })()}
      </div>
    );
  };

  const tabs = [
    { id: AppTab.LIVE, label: 'Talk', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z', color: 'text-violet-600', bg: 'bg-violet-100' },
    { id: AppTab.SEARCH, label: 'Explore', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: AppTab.THINKING, label: 'Wisdom', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'text-green-600', bg: 'bg-green-100' },
    { id: AppTab.TRANSCRIPTION, label: 'Dictate', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'text-orange-600', bg: 'bg-orange-100' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-tr from-violet-500 via-green-400 to-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg transform group-hover:rotate-12 transition-transform">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
            </div>
            <div>
              <h1 className="text-2xl font-black vibgyor-text leading-none tracking-tight">Guru</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Wisdom in your Voice</p>
            </div>
          </div>

          <nav className="hidden md:flex bg-white/50 rounded-full p-1.5 shadow-inner border border-white/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AppTab)}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all bouncy-button ${
                  activeTab === tab.id ? `${tab.bg} ${tab.color} shadow-md` : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon}/></svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 flex items-center justify-center">
        {renderContent()}
      </main>

      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] flex justify-around p-3 shadow-2xl z-20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AppTab)}
            className={`p-4 rounded-3xl transition-all bouncy-button ${
              activeTab === tab.id ? `${tab.bg} ${tab.color} scale-110 shadow-lg` : 'text-gray-300'
            }`}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon}/></svg>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
