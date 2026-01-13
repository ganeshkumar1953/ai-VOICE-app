
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message } from '../types';

const ThinkingView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleReasoning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: prompt, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      // Using gemini-3-pro-preview for deep thinking as requested
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
          thinkingConfig: { thinkingBudget: 32768 },
          systemInstruction: "You are 'Guru', a wise elder neighbor from Andhra Pradesh/Telangana. Provide deep, culturally resonant advice in a mix of Telugu and English. Solve complex problems with the wisdom of a local elder who knows the heart of the people."
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] w-full max-w-3xl mx-auto bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl overflow-hidden border border-indigo-100/50">
      <div className="bg-gradient-to-r from-indigo-700 to-violet-800 p-8 text-white">
        <h2 className="text-2xl font-black flex items-center">
          <svg className="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          Guru Wisdom (లోతైన ఆలోచన)
        </h2>
        <p className="text-indigo-200 text-sm font-medium italic">Seek guidance for life's most complex challenges.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[2rem] px-6 py-4 shadow-lg animate-in fade-in duration-700 ${
              msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-indigo-50 text-gray-800 rounded-tl-none'
            }`}>
              <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-black uppercase text-indigo-400 tracking-[0.3em]">Guru Pondering (యోచిస్తున్నారు)...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleReasoning} className="p-6 bg-white/50 border-t border-indigo-100 flex space-x-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="జీవిత సలహా కోసం అడగండి (Ask for wisdom...)"
          rows={1}
          className="flex-1 px-6 py-4 rounded-[1.5rem] bg-white border-2 border-indigo-50 focus:border-indigo-500 focus:outline-none text-sm font-semibold resize-none shadow-inner transition-all text-gray-900 placeholder-gray-400"
        />
        <button type="submit" disabled={loading} className="px-8 py-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 bouncy-button shadow-xl font-black">
          అడగండి
        </button>
      </form>
    </div>
  );
};

export default ThinkingView;
