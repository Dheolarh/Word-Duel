import React, { createContext, useContext, useState, useEffect } from 'react';
import { playBackgroundMusic, stopBackgroundMusic } from '../utils/sound';

interface AudioSettings {
  backgroundMusicEnabled: boolean;
  soundEffectsEnabled: boolean;
}

interface AudioContextType {
  settings: AudioSettings;
  toggleBackgroundMusic: () => void;
  toggleSoundEffects: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const AUDIO_SETTINGS_KEY = 'wordDuelAudioSettings';

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    // Load settings from localStorage or use defaults
    const saved = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // If parsing fails, use defaults
      }
    }
    return {
      backgroundMusicEnabled: true,
      soundEffectsEnabled: true,
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Handle background music based on settings
  useEffect(() => {
    if (settings.backgroundMusicEnabled) {
      playBackgroundMusic().catch(console.log);
    } else {
      stopBackgroundMusic();
    }
  }, [settings.backgroundMusicEnabled]);

  const toggleBackgroundMusic = () => {
    setSettings(prev => ({
      ...prev,
      backgroundMusicEnabled: !prev.backgroundMusicEnabled,
    }));
  };

  const toggleSoundEffects = () => {
    setSettings(prev => ({
      ...prev,
      soundEffectsEnabled: !prev.soundEffectsEnabled,
    }));
  };

  return (
    <AudioContext.Provider value={{ settings, toggleBackgroundMusic, toggleSoundEffects }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
