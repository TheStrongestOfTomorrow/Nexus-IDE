import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Command } from 'lucide-react';
import { cn } from '../lib/utils';

interface VoiceCommandProps {
  onCommand: (command: string) => void;
  isListening: boolean;
  onToggle: () => void;
}

export default function VoiceCommand({ onCommand, isListening, onToggle }: VoiceCommandProps) {
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        
        if (event.results[current].isFinal) {
          onCommand(transcript.trim().toLowerCase());
          setTranscript('');
        }
      };

      recog.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (isListening) onToggle(); // Turn off on error
      };

      setRecognition(recog);
    }
  }, [onCommand, onToggle, isListening]);

  useEffect(() => {
    if (recognition) {
      if (isListening) {
        recognition.start();
      } else {
        recognition.stop();
      }
    }
  }, [isListening, recognition]);

  if (!recognition) return null; // Not supported

  return (
    <div className={cn(
      "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 transition-all duration-300",
      isListening ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
    )}>
      <div className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl border border-nexus-accent/50 flex items-center gap-4 min-w-[300px] justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
          <Mic size={20} className="relative z-10 text-red-500" />
        </div>
        <div className="flex-1 text-center font-mono text-sm">
          {transcript || "Listening..."}
        </div>
        <button onClick={onToggle} className="hover:text-red-400 transition-colors">
          <MicOff size={18} />
        </button>
      </div>
      <div className="text-[10px] text-white/50 font-mono bg-black/50 px-2 py-1 rounded">
        Try "Run Code", "Open Settings", "Clear Workspace"
      </div>
    </div>
  );
}
