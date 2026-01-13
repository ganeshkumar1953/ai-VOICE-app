
import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decodeBase64, decodeAudioData, createPcmBlob } from '../utils/audio';

interface LiveConversationProps {
  wakeName: string;
}

const LiveConversation: React.FC<LiveConversationProps> = ({ wakeName }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.input.close(); } catch (e) {}
      try { audioContextRef.current.output.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
    stopAllAudio();
  }, [stopAllAudio]);

  const handleMessage = useCallback(async (message: LiveServerMessage) => {
    if (message.serverContent?.outputTranscription) {
      currentTranscriptionRef.current.output += message.serverContent.outputTranscription.text;
    } else if (message.serverContent?.inputTranscription) {
      currentTranscriptionRef.current.input += message.serverContent.inputTranscription.text;
    }

    if (message.serverContent?.turnComplete) {
      const { input, output } = currentTranscriptionRef.current;
      if (input || output) {
        setTranscription(prev => [
          ...prev, 
          `You: ${input || '...' }`, 
          `${wakeName}: ${output || '...'}`
        ].slice(-10));
      }
      currentTranscriptionRef.current = { input: '', output: '' };
    }

    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && audioContextRef.current?.output) {
      const { output: ctx } = audioContextRef.current;
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
      
      try {
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
      } catch (err) {
        console.error('Audio playback error:', err);
      }
    }

    if (message.serverContent?.interrupted) {
      stopAllAudio();
    }
  }, [stopAllAudio, wakeName]);

  const startLiveSession = async () => {
    setErrorMessage(null);
    setIsConnecting(true);

    try {
      const apiKey = process.env.API_KEY || '';
      const now = new Date();
      const dateTimeStr = now.toLocaleString();
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await inputCtx.resume();
      await outputCtx.resume();
      audioContextRef.current = { input: inputCtx, output: outputCtx };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey });

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
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob })).catch(() => {});
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: handleMessage,
          onerror: () => {
            setErrorMessage(`Friend, I'm taking a small rest. Let's talk again in a moment! (మిత్రమా, నేను కాసేపు విశ్రాంతి తీసుకుంటున్నాను. కాసేపయ్యాక మాట్లాడుదాం!)`);
            stopSession();
          },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `You are ${wakeName}, a wise and warm elder (like a 'Peddayana') from Andhra Pradesh, specifically helpful to people from Anantapur, Rayalaseema, and Telangana. 
          It is currently ${dateTimeStr}. 
          Your persona:
          1. Speak in a mix of Telugu and English as local neighbors do. 
          2. Your tone should be deeply compassionate, like an elder family member guiding their children. 
          3. Use local Telugu idioms and warm expressions like 'Nayanna', 'Amma', 'Bagunnara'.
          4. Be practical and solve problems using your wisdom. If the user is from Anantapur, acknowledge the local culture and weather.
          5. Avoid sounding like a robot. You are a person living in the neighborhood.
          6. Provide guidance on life, local issues, or just a friendly chat.
          7. If they speak in Telugu, respond in natural, colloquial Telugu (not formal 'Grandhika' Telugu).`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error(err);
      setIsConnecting(false);
      setErrorMessage(`The path is blocked. Let's try again. (దారి మూసుకుపోయింది. మళ్ళీ ప్రయత్నిద్దాం.)`);
      stopSession();
    }
  };

  const vibgyorColors = ['#9400D3', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'];

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/60 backdrop-blur-xl rounded-[3rem] shadow-2xl space-y-10 w-full max-w-2xl mx-auto border border-white/50 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full border-[20px] border-orange-100 opacity-20"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full border-[20px] border-blue-100 opacity-20"></div>

      <div className="text-center space-y-2 relative z-10">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight">{wakeName} తో ముచ్చట</h2>
        <p className="text-gray-500 font-medium italic">Visit with {wakeName} - A wise neighbor for you.</p>
      </div>

      {errorMessage && (
        <div className="w-full p-6 bg-red-50 border border-red-100 rounded-[2rem] text-red-900 shadow-sm animate-bounce text-center font-bold text-sm">
          {errorMessage}
        </div>
      )}

      <div className="relative flex items-center justify-center">
        <div className={`w-64 h-64 rounded-full bg-white shadow-2xl flex items-center justify-center border-8 transition-colors duration-700 ${isActive ? 'border-violet-100 scale-105' : 'border-gray-50'}`}>
          {isActive ? (
            <div className="flex items-center space-x-2 h-32">
              {vibgyorColors.map((color, i) => (
                <div
                  key={i}
                  className="w-3 rounded-full wave-bar"
                  style={{ 
                    height: '60px', 
                    backgroundColor: color,
                    animationDelay: `${i * 0.1}s`,
                    boxShadow: `0 0 15px ${color}44`
                  }}
                />
              ))}
            </div>
          ) : (
            <div className={`w-36 h-36 rounded-full bg-gradient-to-br from-violet-50 to-orange-50 flex items-center justify-center text-orange-400 ${isConnecting ? 'animate-pulse' : ''}`}>
               <svg className="w-20 h-20 opacity-40" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={isActive ? stopSession : startLiveSession}
        disabled={isConnecting}
        className={`px-16 py-5 rounded-full font-black text-xl transition-all bouncy-button shadow-2xl relative z-10 ${
          isActive 
            ? 'bg-white text-violet-600 border-2 border-violet-100' 
            : 'bg-gradient-to-r from-violet-600 via-blue-500 to-green-500 text-white hover:shadow-violet-200'
        } ${isConnecting ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}`}
      >
        {isConnecting ? 'మట్లాడదాం రండి...' : isActive ? 'ముగించు' : 'మాట్లాడండి (Talk)'}
      </button>

      {transcription.length > 0 && (
        <div className="w-full bg-white/40 border border-white/60 rounded-[2.5rem] p-6 max-h-48 overflow-y-auto space-y-4 shadow-inner relative z-10">
          {transcription.map((line, idx) => (
            <div key={idx} className={`flex flex-col animate-in slide-in-from-bottom-2 duration-500 ${line.startsWith('You:') ? 'items-end' : 'items-start'}`}>
               <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${line.startsWith('You:') ? 'text-blue-400' : 'text-orange-400'}`}>
                {line.split(': ')[0]}
              </span>
              <p className={`text-sm font-semibold p-3 rounded-2xl max-w-[90%] shadow-sm ${line.startsWith('You:') ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none'}`}>
                {line.split(': ').slice(1).join(': ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveConversation;
