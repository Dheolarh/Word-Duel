// Import sound assets
import backgroundSound from '../assets/sounds/background.mp3';
import backgroundHalloweenSound from '../assets/sounds/backgroundHalloween.mp3';
import clickSound from '../assets/sounds/click.mp3';
import loseSound from '../assets/sounds/lose.mp3';
import tieSound from '../assets/sounds/tie.mp3';
import winSound from '../assets/sounds/win.mp3';

// Audio instances for better performance
let backgroundMusic: HTMLAudioElement | null = null;
let clickAudioPool: HTMLAudioElement[] = [];
const audioCache = new Map<string, HTMLAudioElement>();
let audioEnabled = false;

export const sounds = {
  click: clickSound,
  win: winSound,
  lose: loseSound,
  tie: tieSound,
  background: backgroundSound,
  backgroundHalloween: backgroundHalloweenSound,
};

// Create a pool of click sounds for instant playback
const createClickAudioPool = () => {
  clickAudioPool = [];
  for (let i = 0; i < 10; i++) {
    const audio = new Audio(sounds.click);
    audio.volume = 0.7;
    audio.preload = 'auto';
    clickAudioPool.push(audio);
  }
};

// Initialize click audio pool
createClickAudioPool();

// Preload and cache audio instances
const preloadAudio = (src: string): HTMLAudioElement => {
  if (audioCache.has(src)) {
    return audioCache.get(src)!;
  }
  
  const audio = new Audio(src);
  audio.preload = 'auto';
  audioCache.set(src, audio);
  return audio;
};

// Initialize audio cache
Object.values(sounds).forEach(soundPath => {
  preloadAudio(soundPath);
});

export const playSound = (soundPath: string, volume: number = 1) => {
  try {
    // Check if sound effects are enabled
    const audioSettings = localStorage.getItem('wordDuelAudioSettings');
    if (audioSettings) {
      const settings = JSON.parse(audioSettings);
      if (!settings.soundEffectsEnabled) {
        return; // Don't play sound if disabled
      }
    }

    // Use cached audio or create new one
    const audio = audioCache.get(soundPath) || new Audio(soundPath);
    
    // Clone the audio for overlapping sounds
    const audioClone = audio.cloneNode() as HTMLAudioElement;
    audioClone.volume = volume;
    
    // Play immediately without waiting
    const playPromise = audioClone.play();
    
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log('Sound play failed:', error);
      });
    }
    
    // Clean up after playing
    audioClone.addEventListener('ended', () => {
      audioClone.remove();
    });
    
  } catch (error) {
    console.log('Sound initialization failed:', error);
  }
};

// Specific functions for game result sounds with higher volume
export const playWinSound = () => {
  playSound(sounds.win, 0.8); // Louder than background music (0.3)
};

export const playLoseSound = () => {
  playSound(sounds.lose, 0.8); // Louder than background music (0.3)
};

export const playTieSound = () => {
  playSound(sounds.tie, 0.8); // Louder than background music (0.3)
};

export const playClickSound = () => {
  try {
    // Check if sound effects are enabled
    const audioSettings = localStorage.getItem('wordDuelAudioSettings');
    if (audioSettings) {
      const settings = JSON.parse(audioSettings);
      if (!settings.soundEffectsEnabled) {
        return; // Don't play sound if disabled
      }
    }

    // Find an available audio from the pool
    const availableAudio = clickAudioPool.find(audio => audio.paused || audio.ended);
    
    if (availableAudio) {
      availableAudio.currentTime = 0;
      availableAudio.play().catch(() => {
        // Fallback to regular playSound if pool fails
        playSound(sounds.click, 0.7);
      });
    } else {
      // If no available audio in pool, use the first one
      const audio = clickAudioPool[0];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          playSound(sounds.click, 0.7);
        });
      } else {
        // Final fallback
        playSound(sounds.click, 0.7);
      }
    }
  } catch (error) {
    // Fallback to regular playSound
    playSound(sounds.click, 0.7);
  }
};

// Enable audio automatically or on user interaction
export const enableAudio = async () => {
  if (!audioEnabled) {
    audioEnabled = true;
    
    // Try to start background music immediately
    try {
      await playBackgroundMusic();
      console.log('Audio enabled automatically');
    } catch (error) {
      console.log('Automatic audio failed, will enable on user interaction:', error);
      // If automatic playback fails, it will work on next user interaction
    }
  }
};

export const playBackgroundMusic = async () => {
  try {
    if (!backgroundMusic) {
      backgroundMusic = new Audio(sounds.background);
      backgroundMusic.loop = true;
      backgroundMusic.volume = 0.25; // Lower volume for background (reduced from 0.3)
      backgroundMusic.preload = 'auto';
      
      // Ensure the audio is ready to play
      backgroundMusic.load();
    }
    
    // Force enable audio if not already enabled
    if (!audioEnabled) {
      audioEnabled = true;
    }
    
    // Try to play if not already playing
    if (backgroundMusic.paused) {
      backgroundMusic.currentTime = 0;
      const playPromise = backgroundMusic.play();
      if (playPromise !== undefined) {
        await playPromise;
        console.log('Background music started successfully');
      }
    }
  } catch (error) {
    console.log('Background music play failed:', error);
    throw error; // Re-throw to handle in enableAudio
  }
};

export const stopBackgroundMusic = () => {
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  }
};

export const pauseBackgroundMusic = () => {
  if (backgroundMusic) {
    backgroundMusic.pause();
  }
};

export const resumeBackgroundMusic = () => {
  if (backgroundMusic && backgroundMusic.paused) {
    const playPromise = backgroundMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log('Background music resume failed:', error);
      });
    }
  }
};
