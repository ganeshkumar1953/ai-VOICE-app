
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message } from '../types';

const SearchAssistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: { 
          tools: [{ googleSearch: {} }, { googleMaps: {} }],
          systemInstruction: "You are 'Guru', assisting your neighbors in Andhra Pradesh and Telangana. Find local news, places, and events that matter to Telugu people. If they ask about local things in Anantapur or nearby, give grounded, helpful information."
        }
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const urls: Array<{title: string, uri: string}> = groundingChunks.map((chunk: any) => {
        if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
        if (chunk.maps) return { title: chunk.maps.title, uri: chunk.maps.uri };
        return null;
      }).filter(Boolean) as any;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || 'క్షమించండి, నాకు దీని గురించి సమాచారం దొరకలేదు. (I checked around, but couldn\'t find that!)',
        timestamp: new Date(),
        urls: urls.length > 0 ? urls : undefined,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] w-full max-w-3xl mx-auto bg-white/70 backdrop-blur-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/50">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 p-8 text-white">
        <h2 className="text-2xl font-black flex items-center">
          <svg className="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          Neighbor News (మన చుట్టుపక్కల విశేషాలు)
        </h2>
        <p className="text-blue-100 text-sm font-medium italic">Explore the neighborhood and beyond.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[2rem] px-6 py-4 shadow-md animate-in slide-in-from-bottom-4 duration-500 ${
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-blue-50 text-gray-800 rounded-tl-none'
            }`}>
              <p className="text-sm font-semibold">{msg.content}</p>
              {msg.urls && msg.urls.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-100/30 flex flex-wrap gap-2">
                  {msg.urls.map((u, idx) => (
                    <a key={idx} href={u.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase hover:bg-blue-100 transition-colors">
                      {u.title.slice(0, 20)}...
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-blue-400 text-xs animate-pulse font-black uppercase tracking-widest text-center">వెతుకుతున్నాను (Checking)...</div>}
      </div>

      <form onSubmit={handleSearch} className="p-6 bg-white/50 border-t border-white/50 flex space-x-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ఏం జరుగుతోంది? (What's happening?)"
          className="flex-1 px-6 py-4 rounded-full bg-white border-2 border-blue-50 focus:border-blue-500 focus:outline-none text-sm font-semibold transition-all shadow-inner text-gray-900 placeholder-gray-400"
        />
        <button type="submit" disabled={loading} className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all bouncy-button shadow-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
      </form>
    </div>
  );
};

export default SearchAssistant;
