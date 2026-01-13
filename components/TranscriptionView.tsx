
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { encodeBase64 } from '../utils/audio';

const TranscriptionView: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setLoading(true);
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const base64Audio = encodeBase64(new Uint8Array(arrayBuffer));
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { inlineData: { data: base64Audio, mimeType: 'audio/webm' } },
          { text: "Accurately transcribe this neighborly note. If the audio is in Telugu, transcribe it accurately in Telugu script. Capture the warmth and local dialect of Andhra/Telangana." },
        ],
      });
      setTranscription(response.text || 'ఏమీ వినబడలేదు. (Nothing heard.)');
    } catch (error) {
      setTranscription('మళ్ళీ చెప్పండి, సరిగా వినబడలేదు. (Let\'s try again.)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-10 bg-white/80 backdrop-blur-sm rounded-[2.5rem] shadow-xl w-full max-w-2xl mx-auto border border-orange-100/50">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Ledger (నోట్ బుక్)</h2>
        <p className="text-gray-500 text-sm italic">Dictate your notes or messages - Guru will write them down.</p>
      </div>

      <div className="flex flex-col items-center space-y-6 w-full">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 shadow-lg ${
            isRecording ? 'bg-orange-100 text-orange-500 animate-pulse border-2 border-orange-400' : 'bg-orange-500 text-white'
          }`}
        >
          {isRecording ? (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd"/></svg>
          ) : (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"/></svg>
          )}
        </button>

        <p className="text-xs font-bold uppercase tracking-widest text-orange-400">
          {isRecording ? 'వినబడుతోంది... (Listening...)' : 'నొక్కండి (Record)'}
        </p>

        <div className="w-full mt-4">
          <div className="min-h-[200px] w-full bg-[#fffdfa] rounded-3xl p-8 border border-orange-100/50 text-gray-700 leading-relaxed relative shadow-inner">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-3xl">
                <div className="flex space-x-1.5">
                   <div className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce"></div>
                   <div className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce delay-75"></div>
                   <div className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            ) : null}
            <p className={`text-sm ${!transcription ? 'text-gray-300 italic' : 'text-gray-700'}`}>
              {transcription || 'మీ మాటలు ఇక్కడ కనిపిస్తాయి (Your note will appear here)...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionView;
