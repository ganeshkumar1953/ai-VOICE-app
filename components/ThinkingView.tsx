
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: userMessage.content,
        config: {
          thinkingConfig: { thinkingBudget: 32768 }
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
      console.error('Thinking error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-50">
      <div className="bg-purple-600 p-6 text-white">
        <h2 className="text-xl font-bold flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          Deep Neighborhood Advice
        </h2>
        <p className="text-purple-100 text-sm">Tackling the complex stuff, one thought at a time.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map(msg => (
          <div key={msg.id} className="space-y-2">
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col space-y-2">
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 max-w-[85%]">
              <div className="flex items-center space-x-2 text-purple-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                <span className="text-xs font-semibold uppercase">Thinking Deeply...</span>
              </div>
              <p className="text-xs text-purple-400 mt-1 italic">I'm pondering the best approach for this neighborly request.</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleReasoning} className="p-4 bg-white border-t border-gray-100 flex space-x-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a complex question..."
          rows={1}
          className="flex-1 px-4 py-2 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
        />
        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 transition-colors self-end">
          Solve
        </button>
      </form>
    </div>
  );
};

export default ThinkingView;
