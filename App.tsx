
import React, { useState } from 'react';
import { AppTab } from './types';
import LiveConversation from './components/LiveConversation';
import SearchAssistant from './components/SearchAssistant';
import ThinkingView from './components/ThinkingView';
import TranscriptionView from './components/TranscriptionView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.LIVE);
  const [neighborName] = useState('Mrs. Gable');

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.LIVE:
        return <LiveConversation wakeName={neighborName} />;
      case AppTab.SEARCH:
        return <SearchAssistant />;
      case AppTab.THINKING:
        return <ThinkingView />;
      case AppTab.TRANSCRIPTION:
        return <TranscriptionView />;
      default:
        return <LiveConversation wakeName={neighborName} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Kinship Voice</h1>
              <p className="text-xs text-gray-500 font-medium">Neighborhood Assistant</p>
            </div>
          </div>

          <nav className="hidden md:flex bg-gray-100 rounded-full p-1 shadow-inner">
            {[
              { id: AppTab.LIVE, label: 'Live Voice', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
              { id: AppTab.SEARCH, label: 'Local Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { id: AppTab.THINKING, label: 'Deep Chat', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { id: AppTab.TRANSCRIPTION, label: 'Scribe', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AppTab)}
                className={`flex items-center space-x-2 px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}/></svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-12 flex flex-col items-center justify-center">
        {renderContent()}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-4">
        {[
          { id: AppTab.LIVE, icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
          { id: AppTab.SEARCH, icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
          { id: AppTab.THINKING, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { id: AppTab.TRANSCRIPTION, icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AppTab)}
            className={`p-3 rounded-2xl transition-all ${
              activeTab === tab.id ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}/></svg>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
