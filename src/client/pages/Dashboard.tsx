import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Modal } from '../components/Modal';
import { SoundButton } from '../components/SoundButton';
import { ImageWithFallback } from '../components/fallback/ImageWithFallback';
import { Toggle } from '../components/Toggle';
import { useAudio } from '../contexts/AudioContext';
import { playBackgroundMusic } from '../utils/sound';
import logo from '../assets/themes/Default/Logo.webp';
import leaderboardIcon from '../assets/themes/Default/LeaderboardButton.webp';
import settingsIcon from '../assets/themes/Default/Settings.webp';
import musicIcon from '../assets/themes/Default/Music.webp';
import tutorialIcon from '../assets/themes/Default/Tutorial.webp';
import playIcon from '../assets/themes/Default/PlayButton.webp';
import playGameText from '../assets/themes/Default/PlayGameText.webp';
import leaderboardHeader from '../assets/themes/Default/Leaderboard.webp';
import themesHeader from '../assets/themes/Default/Themes.webp';

interface DashboardProps {
  onPlay: () => void;
}

export function Dashboard({ onPlay }: DashboardProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [settingsMode, setSettingsMode] = useState<'themes' | 'music'>('themes');
  const [selectedTheme, setSelectedTheme] = useState<'green' | 'halloween'>('green');
  const { settings, toggleBackgroundMusic, toggleSoundEffects } = useAudio();

  // Auto-trigger background music immediately when dashboard loads
  useEffect(() => {
    const triggerBackgroundMusic = async () => {
      try {
        // Method 1: Try direct playback first (works if user already interacted)
        try {
          await playBackgroundMusic();
          console.log('Background music started directly on dashboard load');
          return;
        } catch (error) {
          console.log('Direct background music failed, trying interaction simulation:', error);
        }

        // Method 2: Create a visually unnoticeable interaction to enable audio
        const invisibleButton = document.createElement('button');
        invisibleButton.style.position = 'absolute';
        invisibleButton.style.left = '-9999px';
        invisibleButton.style.width = '1px';
        invisibleButton.style.height = '1px';
        invisibleButton.style.opacity = '0';
        invisibleButton.style.pointerEvents = 'none';
        invisibleButton.setAttribute('aria-hidden', 'true');
        
        document.body.appendChild(invisibleButton);
        
        // Add event listener to trigger music on click
        invisibleButton.addEventListener('click', async () => {
          try {
            await playBackgroundMusic();
            console.log('Background music started via invisible interaction');
          } catch (error) {
            console.log('Invisible interaction background music failed:', error);
          }
        });
        
        // Programmatically click the invisible button
        invisibleButton.click();
        
        // Method 3: Fallback with multiple attempts
        let attempts = 0;
        const maxAttempts = 3;
        const retryInterval = setInterval(async () => {
          attempts++;
          try {
            await playBackgroundMusic();
            console.log(`Background music started on attempt ${attempts}`);
            clearInterval(retryInterval);
            document.body.removeChild(invisibleButton);
          } catch (error) {
            if (attempts >= maxAttempts) {
              console.log('All background music auto-start attempts failed, will start on user interaction');
              clearInterval(retryInterval);
              document.body.removeChild(invisibleButton);
              
              // Method 4: Final fallback - listen for any user interaction
              const startMusicOnInteraction = async () => {
                try {
                  await playBackgroundMusic();
                  console.log('Background music started on user interaction');
                  // Remove listeners after successful start
                  document.removeEventListener('click', startMusicOnInteraction);
                  document.removeEventListener('touchstart', startMusicOnInteraction);
                  document.removeEventListener('mousemove', startMusicOnInteraction);
                } catch (error) {
                  console.log('User interaction background music failed:', error);
                }
              };
              
              // Add one-time listeners for various user interactions
              document.addEventListener('click', startMusicOnInteraction, { once: true });
              document.addEventListener('touchstart', startMusicOnInteraction, { once: true });
              document.addEventListener('mousemove', startMusicOnInteraction, { once: true });
            }
          }
        }, 200);
        
      } catch (error) {
        console.log('Auto-trigger setup failed:', error);
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(triggerBackgroundMusic, 50);
    
    return () => clearTimeout(timer);
  }, []);

  const mockLeaderboard = [
    { rank: 1, name: 'WordMaster', points: 1250 },
    { rank: 2, name: 'LetterLord', points: 1100 },
    { rank: 3, name: 'GuessGuru', points: 980 },
    { rank: 4, name: 'VocabViking', points: 850 },
    { rank: 5, name: 'SpellSlayer', points: 720 },
  ];

  return (
    <div className="w-full h-screen flex flex-col p-2 overflow-hidden">
      {/* Top bar with Settings, Music, Leaderboard and Tutorial */}
      <div className="flex justify-between items-start mb-auto">
        <div className="flex flex-col gap-2">
          <SoundButton
            onClick={() => {
              setSettingsMode('themes');
              setShowSettings(true);
            }}
            className="w-10 h-10 hover:scale-105 transition-transform"
          >
            <img src={settingsIcon} alt="Settings" className="w-full h-full" />
          </SoundButton>
          
          <SoundButton
            onClick={() => {
              setSettingsMode('music');
              setShowSettings(true);
            }}
            className="w-10 h-10 hover:scale-105 transition-transform"
          >
            <img src={musicIcon} alt="Music" className="w-full h-full" />
          </SoundButton>
        </div>

        <div className="flex flex-col gap-2">
          <SoundButton
            onClick={() => setShowLeaderboard(true)}
            className="w-10 h-10 hover:scale-105 transition-transform"
          >
            <img src={leaderboardIcon} alt="Leaderboard" className="w-full h-full" />
          </SoundButton>
          
          <SoundButton
            onClick={() => setShowTutorial(true)}
            className="w-10 h-10 hover:scale-105 transition-transform"
          >
            <img src={tutorialIcon} alt="Tutorial" className="w-full h-full" />
          </SoundButton>
        </div>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center justify-center flex-1 gap-4 max-w-md w-full mx-auto">
        <img src={logo} alt="Word Duel" className="w-44 max-w-full" />

        <div className="flex flex-col items-center gap-2">
          <SoundButton onClick={onPlay} className="w-20 h-20 hover:scale-105 transition-transform">
            <img src={playIcon} alt="Play" className="w-full h-full" />
          </SoundButton>
          <img src={playGameText} alt="Play Game" className="w-32" />
        </div>
      </div>

      {/* Bottom spacer to balance the layout */}
      <div className="h-10" />

      <AnimatePresence>
        {showLeaderboard && (
          <Modal headerImage={leaderboardHeader} onClose={() => setShowLeaderboard(false)}>
            <div className="space-y-1">
              {mockLeaderboard.map((entry) => (
                <div key={entry.rank} className="flex items-center justify-between py-1">
                  <span className="text-sm text-[#2d5016]">{entry.name}</span>
                  <span className="text-sm text-[#2d5016]">{entry.points}</span>
                </div>
              ))}
            </div>
          </Modal>
        )}

        {showTutorial && (
          <Modal headerImage={tutorialIcon} onClose={() => setShowTutorial(false)}>
            <div className="space-y-3 px-2 text-[#2d5016]">
              <div className="text-center">
                <h3 className="text-lg font-bold mb-2">How to Play Word Duel</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <p><strong>🎯 Objective:</strong> Guess your opponent's secret word before they guess yours!</p>
                
                <p><strong>🎮 Gameplay:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Enter a valid word of the correct length</li>
                  <li>Green letters are in the correct position</li>
                  <li>Yellow letters are in the word but wrong position</li>
                  <li>Red letters are not in the word at all</li>
                </ul>
                
                <p><strong>⏱️ Time Limit:</strong> Race against the clock to solve the puzzle!</p>
                
                <p><strong>🏆 Winning:</strong> First to guess the opponent's word wins. If time runs out, whoever has made more progress wins!</p>
              </div>
            </div>
          </Modal>
        )}

        {showSettings && (
          <Modal 
            headerImage={settingsMode === 'themes' ? themesHeader : musicIcon} 
            onClose={() => setShowSettings(false)}
          >
            {settingsMode === 'themes' ? (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setSelectedTheme('green')}
                  className={`flex flex-col items-center gap-1.5 transition-transform ${
                    selectedTheme === 'green' ? 'scale-105' : 'hover:scale-105'
                  }`}
                >
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1510833077447-0ec21d50d8ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMG5hdHVyZSUyMHRoZW1lfGVufDF8fHx8MTc2MDkwOTEwN3ww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Green Theme"
                    className={`w-16 h-16 rounded-lg object-cover border-3 ${
                      selectedTheme === 'green' ? 'border-green-600' : 'border-transparent'
                    }`}
                  />
                  <span className="text-xs text-[#2d5016]">Green Theme</span>
                </button>
                <button
                  onClick={() => setSelectedTheme('halloween')}
                  className={`flex flex-col items-center gap-1.5 transition-transform ${
                    selectedTheme === 'halloween' ? 'scale-105' : 'hover:scale-105'
                  }`}
                >
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1608590898839-de14c56b7fe5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWxsb3dlZW4lMjBwdW1wa2luJTIwc3Bvb2t5fGVufDF8fHx8MTc2MDkwOTEwOXww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Halloween Theme"
                    className={`w-16 h-16 rounded-lg object-cover border-3 ${
                      selectedTheme === 'halloween' ? 'border-orange-600' : 'border-transparent'
                    }`}
                  />
                  <span className="text-xs text-[#2d5016]">Halloween Theme</span>
                </button>
              </div>
            ) : (
              <div className="px-4 py-3">
                <div className="space-y-6">
                  <Toggle
                    enabled={settings.backgroundMusicEnabled}
                    onToggle={toggleBackgroundMusic}
                    label="Background Music"
                  />
                  <Toggle
                    enabled={settings.soundEffectsEnabled}
                    onToggle={toggleSoundEffects}
                    label="Sound Effects"
                  />
                </div>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
