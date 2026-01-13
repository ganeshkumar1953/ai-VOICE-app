
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decodeBase64, decodeAudioData, createPcmBlob } from '../utils/audio';

interface LiveConversationProps {
  wakeName: string;
}

const LiveConversation: React.FC<LiveConversationProps> = ({ wakeName }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentTranscriptionRef = useRef({ input: '', output: '' });

  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const handleMessage = useCallback(async (message: LiveServerMessage) => {
    if (message.serverContent?.outputTranscription) {
      currentTranscriptionRef.current.output += message.serverContent.outputTranscription.text;
    } else if (message.serverContent?.inputTranscription) {
      currentTranscriptionRef.current.input += message.serverContent.inputTranscription.text;
    }

    if (message.serverContent?.turnComplete) {
      setTranscription(prev => [
        ...prev, 
        `User: ${currentTranscriptionRef.current.input}`, 
        `Neighbor: ${currentTranscriptionRef.current.output}`
      ]);
      currentTranscriptionRef.current = { input: '', output: '' };
    }

    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio && audioContextRef.current) {
      const { output: ctx } = audioContextRef.current;
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
      
      const audioBuffer = await decodeAudioData(
        decodeBase64(base64Audio),
        ctx,
        24000,
        1
      );
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.addEventListener('ended', () => sourcesRef.current.delete(source));
      source.start(nextStartTimeRef.current);
      
      nextStartTimeRef.current += audioBuffer.duration;
      sourcesRef.current.add(source);
    }

    if (message.serverContent?.interrupted) {
      stopAllAudio();
    }
  }, [stopAllAudio]);

  const startSession = async () => {
    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = { input: inputCtx, output: outputCtx };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: handleMessage,
          onerror: (e) => console.error('Live API Error:', e),
          onclose: () => {
            setIsActive(false);
            stopAllAudio();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: `You are a warm, helpful neighbor or family member named ${wakeName}. 
          Speak with a friendly, colloquial tone. Use the user's native language and local idioms where appropriate. 
          Make the conversation feel cozy and personal. If the user calls your name "${wakeName}", respond enthusiastically.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error('Failed to start session:', error);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
    stopAllAudio();
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl space-y-8 w-full max-w-2xl mx-auto border border-orange-100">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Talk to {wakeName}</h2>
        <p className="text-gray-500">Your friendly neighbor is always here to chat.</p>
      </div>

      <div className="relative h-48 w-48 flex items-center justify-center">
        {isActive ? (
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-orange-400 rounded-full wave-animation"
                style={{ height: '40px', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full bg-orange-50 flex items-center justify-center text-orange-400 animate-pulse">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"/></svg>
          </div>
        )}
      </div>

      <button
        onClick={isActive ? stopSession : startSession}
        disabled={isConnecting}
        className={`px-12 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg ${
          isActive 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-orange-500 hover:bg-orange-600 text-white'
        } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isConnecting ? 'Connecting...' : isActive ? 'End Conversation' : 'Start Talking'}
      </button>

      {transcription.length > 0 && (
        <div className="w-full bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto border border-gray-100 space-y-2">
          {transcription.map((line, idx) => (
            <p key={idx} className={`text-sm ${line.startsWith('User:') ? 'text-gray-600 font-medium' : 'text-orange-700'}`}>
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveConversation;
