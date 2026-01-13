
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

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

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
          {
            inlineData: {
              data: base64Audio,
              mimeType: 'audio/webm',
            },
          },
          { text: "Transcribe the audio accurately. Detect the language and maintain punctuation." },
        ],
      });

      setTranscription(response.text || 'No speech detected.');
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscription('Error during transcription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-xl w-full max-w-2xl mx-auto border border-green-50">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Neighbor's Scribe</h2>
        <p className="text-gray-500">Record a note and let me write it down for you.</p>
      </div>

      <div className="flex flex-col items-center space-y-6 w-full">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-lg ${
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'
          } text-white`}
        >
          {isRecording ? (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd"/></svg>
          ) : (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"/></svg>
          )}
        </button>

        <p className="text-sm font-medium text-gray-400">
          {isRecording ? 'Listening carefully...' : 'Tap to start recording'}
        </p>

        <div className="w-full mt-4">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Transcription Output</label>
          <div className="min-h-[150px] w-full bg-gray-50 rounded-2xl p-6 border border-gray-100 text-gray-700 whitespace-pre-wrap relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-2xl">
                <div className="flex space-x-1">
                   <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-75"></div>
                   <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            ) : null}
            {transcription || 'Speak into the microphone to see the transcription...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionView;
