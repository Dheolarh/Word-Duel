import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Modal } from '../components/Modal';
import { SoundButton } from '../components/SoundButton';
import { ImageWithFallback } from '../components/fallback/ImageWithFallback';
import { Toggle } from '../components/Toggle';
import { useAudio } from '../contexts/AudioContext';
import { playBackgroundMusic } from '../utils/sound';
import { LeaderboardEntry } from '../../shared/types/game';
import { getCurrentUserProfile } from '../utils/userProfile';
import logo from '../assets/themes/Default/Logo.webp';
import background from '../assets/themes/Default/Background.webp';
import backgroundHalloween from '../assets/themes/Halloween/Background.webp';
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentPlayerData, setCurrentPlayerData] = useState<LeaderboardEntry | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { settings, toggleBackgroundMusic, toggleSoundEffects } = useAudio();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getCurrentUserProfile();
        if (profile && profile.username) setDisplayName(profile.username);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

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

  // Fetch leaderboard data when component mounts or when leaderboard modal is opened
  const fetchLeaderboard = async () => {
    if (leaderboardLoading) return; // Prevent multiple simultaneous requests
    
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    
    try {
      // Get current user profile for highlighting
      let userId = currentUserId;
      if (!userId) {
        try {
          const profile = await getCurrentUserProfile();
          userId = profile.userId;
          setCurrentUserId(userId);
        } catch (error) {
          console.log('Could not get current user profile:', error);
        }
      }
      
      // Fetch leaderboard with current user context
      const url = userId ? `/api/get-leaderboard?limit=100&currentUserId=${encodeURIComponent(userId)}` : '/api/get-leaderboard?limit=100';
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data?.leaderboard) {
        setLeaderboard(result.data.leaderboard);
        setCurrentPlayerData(result.data.currentPlayerData || null);
        setLeaderboardError(null);
      } else {
        setLeaderboardError(result.error || 'Failed to load leaderboard');
        // Fallback to empty array if no data
        setLeaderboard([]);
        setCurrentPlayerData(null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboardError('Network error loading leaderboard');
      setLeaderboard([]);
      setCurrentPlayerData(null);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Fetch leaderboard when component mounts
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Handle leaderboard modal opening
  const handleShowLeaderboard = () => {
    setShowLeaderboard(true);
    // Refresh leaderboard data when modal opens
    fetchLeaderboard();
  };

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
            onClick={handleShowLeaderboard}
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

        {displayName && (
          <div className="text-xs text-[#2d5016] mt-2">Hello, <span className="font-semibold">{displayName}</span></div>
        )}

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
            <div className="flex flex-col max-h-[85vh]">
              {leaderboardLoading ? (
                <div className="text-center py-4">
                  <span className="text-sm text-[#2d5016]">Loading leaderboard...</span>
                </div>
              ) : leaderboardError ? (
                <div className="text-center py-4">
                  <span className="text-sm text-red-600">{leaderboardError}</span>
                  <button 
                    onClick={fetchLeaderboard}
                    className="block mx-auto mt-2 px-3 py-1 text-xs bg-[#2d5016] text-white rounded hover:bg-[#1a2f0a] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : leaderboard.length === 0 && !currentPlayerData ? (
                <div className="text-center py-4">
                  <span className="text-sm text-[#2d5016]">No players on leaderboard yet.</span>
                  <p className="text-xs text-[#2d5016] mt-1">Play some games to see rankings!</p>
                </div>
              ) : (
                <>
                  {/* Current Player Highlight (if not in top 100) */}
                  {currentPlayerData && !leaderboard.find(entry => entry.userId === currentPlayerData.userId) && (
                    <div className="mb-3 pb-2 border-b border-[#4a9b3c]/30">
                      <div className="text-xs text-[#2d5016] mb-1 text-center font-semibold">Your Position</div>
                      <div className="flex items-center justify-between py-2 px-2 bg-gradient-to-r from-[#e8f5e3] to-[#d4ead0] rounded-md border-2 border-[#4a9b3c]">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#2d5016] font-bold w-6">#{currentPlayerData.rank}</span>
                          <span className="text-sm text-[#2d5016] font-semibold">{currentPlayerData.username}</span>
                        </div>
                        <span className="text-sm text-[#2d5016] font-bold">{currentPlayerData.points}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Top 100 Leaderboard */}
                  {leaderboard.length > 0 && (
                    <>
                      <div className="text-xs text-[#2d5016] mb-2 text-center font-semibold">
                        Top {leaderboard.length} Players
                      </div>
                      <div 
                        className="overflow-y-auto max-h-[400px] space-y-1 pr-1 leaderboard-scroll" 
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#4a9b3c #e5e7eb'
                        }}
                      >
                        {leaderboard.map((entry) => {
                          const isCurrentPlayer = currentUserId && entry.userId === currentUserId;
                          return (
                            <div 
                              key={`${entry.rank}-${entry.userId}`} 
                              className={`flex items-center justify-between py-2 px-2 rounded-md transition-colors ${
                                isCurrentPlayer 
                                  ? 'bg-gradient-to-r from-[#e8f5e3] to-[#d4ead0] border-2 border-[#4a9b3c]' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold w-6 ${
                                  isCurrentPlayer ? 'text-[#2d5016]' : 'text-[#2d5016]'
                                }`}>
                                  #{entry.rank}
                                </span>
                                <span className={`text-sm ${
                                  isCurrentPlayer ? 'text-[#2d5016] font-semibold' : 'text-[#2d5016]'
                                }`}>
                                  {entry.username}
                                </span>
                              </div>
                              <span className={`text-sm font-semibold ${
                                isCurrentPlayer ? 'text-[#2d5016] font-bold' : 'text-[#2d5016]'
                              }`}>
                                {entry.points}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}
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
                    src={background}
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
                    src={backgroundHalloween}
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
