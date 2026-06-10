import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

type VoiceCommand = {
  pattern: RegExp;
  action: () => void;
  description: string;
};

export function useVoiceNav() {
  const [location, setLocation] = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const navigate = (path: string) => setLocation(path);

  const commands: VoiceCommand[] = [
    {
      pattern: /dashboard|home|main/i,
      action: () => navigate('/dashboard'),
      description: 'Go to Dashboard',
    },
    {
      pattern: /hope|code|engineer|ai/i,
      action: () => navigate('/engineer'),
      description: 'Open HopeAI',
    },
    {
      pattern: /school|learn|course|education/i,
      action: () => navigate('/school'),
      description: 'Open Sky School',
    },
    {
      pattern: /arcade|game|play|gaming/i,
      action: () => navigate('/arcade'),
      description: 'Open Arcade',
    },
    {
      pattern: /trade|trading|market|signals/i,
      action: () => navigate('/trading'),
      description: 'Open Day Trade Room',
    },
    {
      pattern: /video|stream|live|upload/i,
      action: () => navigate('/videos'),
      description: 'Open Video Area',
    },
    {
      pattern: /social|post|feed|community/i,
      action: () => navigate('/social'),
      description: 'Open Social Media',
    },
    {
      pattern: /shop|escrow|buy|sell|marketplace/i,
      action: () => navigate('/escrow'),
      description: 'Open Escrow Shop',
    },
    {
      pattern: /charity|donate|help|cause/i,
      action: () => navigate('/charity'),
      description: 'Open Charity',
    },
    {
      pattern: /vote|governance|proposal|dao/i,
      action: () => navigate('/governance'),
      description: 'Open Governance',
    },
    {
      pattern: /analytics|data|insight|metric/i,
      action: () => navigate('/analytics'),
      description: 'Open Analytics',
    },
    {
      pattern: /back|return|previous/i,
      action: () => window.history.back(),
      description: 'Go Back',
    },
    {
      pattern: /logout|exit|quit/i,
      action: () => {
        window.location.href = '/api/oauth/logout';
      },
      description: 'Logout',
    },
  ];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);

    recognitionRef.current.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const matched = commands.find((cmd) => cmd.pattern.test(text));
          if (matched) {
            matched.action();
            setTranscript(`✓ ${matched.description}`);
          } else {
            setTranscript(`❌ Command not recognized: "${text}"`);
          }
        } else {
          interim += text;
        }
      }
      if (interim) setTranscript(interim);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setTranscript(`⚠️ Error: ${event.error}`);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [commands]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.abort();
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    commands,
  };
}
