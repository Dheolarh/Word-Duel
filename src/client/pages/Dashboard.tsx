import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Modal } from '../components/Modal';
import { SoundButton } from '../components/SoundButton';
import { ImageWithFallback } from '../components/fallback/ImageWithFallback';
import { Toggle } from '../components/Toggle';
import { useAudio } from '../contexts/AudioContext';
import { useTheme } from '../contexts/ThemeContext';
import { playBackgroundMusic } from '../utils/sound';
import { LeaderboardEntry } from '../../shared/types/game';
import { getCurrentUserProfile } from '../utils/userProfile';
// Theme assets are provided by ThemeContext (assets map)

interface DashboardProps {
  onPlay: () => void;
}

export function Dashboard({ onPlay }: DashboardProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [settingsMode, setSettingsMode] = useState<'themes' | 'music'>('themes');
  const { theme, setTheme, assets, allAssets, allTokens, festivalColors } = useTheme();
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
        // Method 1: Try direct playback first (works if user already interacted).
        // Only attempt playback if audio settings allow background music.
        try {
          const audioSettingsRaw = localStorage.getItem('wordDuelAudioSettings');
          const audioSettings = audioSettingsRaw ? JSON.parse(audioSettingsRaw) : null;
          const bgEnabled = audioSettings ? !!audioSettings.backgroundMusicEnabled : true;
          if (!bgEnabled) {
            return; // user has disabled background music
          }

          // Determine desired variant from theme
          const savedTheme = localStorage.getItem('wordDuelTheme');
          const variant = savedTheme === 'Festive' ? 'festive' : 'default';

          await playBackgroundMusic(variant);
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
            <img src={assets.settingsIcon} alt="Settings" className="w-full h-full" />
          </SoundButton>
          
          <SoundButton
            onClick={() => {
              setSettingsMode('music');
              setShowSettings(true);
            }}
            className="w-10 h-10 hover:scale-105 transition-transform"
          >
            <img src={assets.musicIcon} alt="Music" className="w-full h-full" />
          </SoundButton>
        </div>

        <div className="flex flex-col gap-2">
          <SoundButton
            onClick={handleShowLeaderboard}
            className="w-10 h-10 hover:scale-105 transition-transform"
          >
            <img src={assets.leaderboardIcon} alt="Leaderboard" className="w-full h-full" />
          </SoundButton>
          
          <SoundButton
            onClick={() => setShowTutorial(true)}
            className="w-10 h-10 hover:scale-105 transition-transform"
          >
            <img src={assets.tutorialIcon} alt="Tutorial" className="w-full h-full" />
          </SoundButton>
        </div>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center justify-center flex-1 gap-4 max-w-md w-full mx-auto">
  <img src={assets.logo} alt="Word Duel" className="w-44 max-w-full" />

        {displayName && (
          <div className="text-xs mt-2" style={{ color: theme === 'Festive' ? '#FFFFFF' : 'var(--primary)' }}>Hello, <span className="font-semibold">{displayName}</span></div>
        )}

        <div className="flex flex-col items-center gap-2">
          <SoundButton onClick={onPlay} className="w-20 h-20 hover:scale-105 transition-transform">
            <img src={assets.playIcon} alt="Play" className="w-full h-full" />
          </SoundButton>
          {/* Hide the play game text during Festive/Halloween mode */}
          {theme !== 'Festive' && (
            <img src={assets.playGameText} alt="Play Game" className="w-32" />
          )}
        </div>
      </div>

      {/* Bottom spacer to balance the layout */}
      <div className="h-10" />

      <AnimatePresence>
        {showLeaderboard && (
          <Modal headerImage={assets.leaderboardHeader} onClose={() => setShowLeaderboard(false)}>
            <div className="flex flex-col max-h-[85vh]" style={{ color: 'initial' }}>
              {leaderboardLoading ? (
                  <div className="text-center py-4">
                  <span className="text-sm text-current">Loading leaderboard...</span>
                </div>
              ) : leaderboardError ? (
                <div className="text-center py-4">
                  <span className="text-sm text-red-600">{leaderboardError}</span>
                  <button 
                    onClick={fetchLeaderboard}
                    className="block mx-auto mt-2 px-3 py-1 text-xs bg-[var(--primary)] text-[var(--on-primary)] rounded hover:bg-[var(--primary-dark)] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : leaderboard.length === 0 && !currentPlayerData ? (
                <div className="text-center py-4">
                  <span className="text-sm text-current">No players on leaderboard yet.</span>
                  <p className="text-xs text-current mt-1">Play some games to see rankings!</p>
                </div>
              ) : (
                <>
                  {/* Current Player Highlight (if not in top 100) */}
                  {currentPlayerData && !leaderboard.find(entry => entry.userId === currentPlayerData.userId) && (
                    <div className="mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)', opacity: 0.3 }}>
                      <div className="text-xs text-current mb-1 text-center font-semibold">Your Position</div>
                      <div className="flex items-center justify-between py-2 px-2 rounded-md border-2" style={{ borderColor: 'var(--border-color)', backgroundImage: 'linear-gradient(to right, var(--bg-from), var(--bg-to))' }}>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-current font-bold w-6">#{currentPlayerData.rank}</span>
                          <span className="text-sm text-current font-semibold">{currentPlayerData.username}</span>
                        </div>
                        <span className="text-sm text-current font-bold">{currentPlayerData.points}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Top 100 Leaderboard */}
                  {leaderboard.length > 0 && (
                    <>
                      <div className="text-xs text-current mb-2 text-center font-semibold">
                        Top {leaderboard.length} Players
                      </div>
                      <div 
                        className="overflow-y-auto max-h-[400px] space-y-1 pr-1 leaderboard-scroll" 
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'var(--border-color) #e5e7eb'
                        }}
                      >
                        {leaderboard.map((entry) => {
                          const isCurrentPlayer = currentUserId && entry.userId === currentUserId;
                          return (
                            <div 
                              key={`${entry.rank}-${entry.userId}`} 
                              className={`flex items-center justify-between py-2 px-2 rounded-md transition-colors ${
                                isCurrentPlayer 
                                  ? 'border-2' 
                                  : 'hover:bg-gray-50'
                              }`}
                              style={isCurrentPlayer ? { borderColor: 'var(--border-color)', backgroundImage: 'linear-gradient(to right, var(--bg-from), var(--bg-to))' } : undefined}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold w-6 ${
                                  isCurrentPlayer ? 'text-current' : 'text-current'
                                }`}>
                                  #{entry.rank}
                                </span>
                                <span className={`text-sm ${
                                  isCurrentPlayer ? 'text-current font-semibold' : 'text-current'
                                }`}>
                                  {entry.username}
                                </span>
                              </div>
                              <span className={`text-sm font-semibold ${
                                isCurrentPlayer ? 'text-current font-bold' : 'text-current'
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
          <Modal headerImage={assets.tutorialIcon} onClose={() => setShowTutorial(false)}>
            <div className="space-y-3 px-2 text-current">
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
                  <li>Grey letters are not in the word at all</li>
                </ul>
                
                <p><strong>⏱️ Time Limit:</strong> Race against the clock to solve the puzzle!</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Easy: 10 minutes, Infinite attempts</li>
                  <li>Medium: 7 minutes, 10 attempts</li>
                  <li>Difficult: 5 minutes, 6 attempts</li>
                </ul>
                
                <p><strong>🏆 Winning:</strong> First to guess the opponent's word wins. If time runs out, It's a tie!</p>
              </div>
            </div>
          </Modal>
        )}

        {showSettings && (
          <Modal 
            headerImage={settingsMode === 'themes' ? assets.themesHeader : assets.musicIcon} 
            onClose={() => setShowSettings(false)}
          >
            {settingsMode === 'themes' ? (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setTheme('green')}
                  className={`flex flex-col items-center gap-1.5 transition-transform ${
                    theme === 'green' ? 'scale-105' : 'hover:scale-105'
                  }`}
                >
                  <ImageWithFallback
                    src={allAssets.green.background}
                    alt="Green Theme"
                    className={`w-16 h-16 rounded-lg object-cover border-3`}
                    style={{ borderColor: theme === 'green' ? allTokens.green.border : 'transparent' }}
                  />
                  <span className="text-xs text-current">Green Theme</span>
                </button>
                <button
                  onClick={() => setTheme('Festive')}
                  className={`flex flex-col items-center gap-1.5 transition-transform ${
                    theme === 'Festive' ? 'scale-105' : 'hover:scale-105'
                  }`}
                >
                  <ImageWithFallback
                    src={allAssets.Festive.background}
                    alt="Festive Theme"
                    className={`w-16 h-16 rounded-lg object-cover border-3`}
                    style={{ borderColor: theme === 'Festive' ? allTokens.Festive.border : 'transparent' }}
                  />
                  <span className="text-xs text-current">Halloween Theme</span>
                </button>
              </div>
            ) : (
              <div className="px-4 py-3">
                <div className="space-y-6">
                  <Toggle
                    enabled={settings.backgroundMusicEnabled}
                    onToggle={toggleBackgroundMusic}
                    label="Background Music"
                    labelColor={theme === 'Festive' ? (festivalColors?.modalText ?? '#FFA500') : undefined}
                  />
                  <Toggle
                    enabled={settings.soundEffectsEnabled}
                    onToggle={toggleSoundEffects}
                    label="Sound Effects"
                    labelColor={theme === 'Festive' ? (festivalColors?.modalText ?? '#FFA500') : undefined}
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
