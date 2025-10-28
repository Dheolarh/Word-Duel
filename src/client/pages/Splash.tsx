import { useEffect, useState } from 'react';
import { enableAudio } from '../utils/sound';
import { useTheme } from '../contexts/ThemeContext';

// Import all Default theme images
import logo from '../assets/themes/Default/Logo.webp';
import background from '../assets/themes/Default/Background.webp';
import backImg from '../assets/themes/Default/Back.webp';
import easyImg from '../assets/themes/Default/Easy.webp';
import hardImg from '../assets/themes/Default/Hard.webp';
import leaderboardImg from '../assets/themes/Default/Leaderboard.webp';
import leaderboardButtonImg from '../assets/themes/Default/LeaderboardButton.webp';
import loseImg from '../assets/themes/Default/Lose.webp';
import mediumImg from '../assets/themes/Default/Medium.webp';
import multiplayerImg from '../assets/themes/Default/Multiplayer.webp';
import pauseImg from '../assets/themes/Default/Pause.webp';
import playButtonImg from '../assets/themes/Default/PlayButton.webp';
import playGameTextImg from '../assets/themes/Default/PlayGameText.webp';
import quitImg from '../assets/themes/Default/Quit.webp';
import settingsImg from '../assets/themes/Default/Settings.webp';
import singleplayerImg from '../assets/themes/Default/Singleplayer.webp';
import themesImg from '../assets/themes/Default/Themes.webp';
import tieImg from '../assets/themes/Default/Tie.webp';
import winImg from '../assets/themes/Default/Win.webp';

// Import all Festive theme images
import logoFestive from '../assets/themes/Festive/Logo.webp';
import backgroundFestive from '../assets/themes/Festive/Background.webp';
import backImgFestive from '../assets/themes/Festive/Back.webp';
import easyImgFestive from '../assets/themes/Festive/Easy.webp';
import hardImgFestive from '../assets/themes/Festive/Hard.webp';
import leaderboardImgFestive from '../assets/themes/Festive/Leaderboard.webp';
import leaderboardButtonImgFestive from '../assets/themes/Festive/LeaderboardButton.webp';
import loseImgFestive from '../assets/themes/Festive/Lose.webp';
import mediumImgFestive from '../assets/themes/Festive/Medium.webp';
import multiplayerImgFestive from '../assets/themes/Festive/Multiplayer.webp';
import pauseImgFestive from '../assets/themes/Festive/Pause.webp';
import playButtonImgFestive from '../assets/themes/Festive/PlayButton.webp';
import quitImgFestive from '../assets/themes/Festive/Quit.webp';
import settingsImgFestive from '../assets/themes/Festive/Settings.webp';
import singleplayerImgFestive from '../assets/themes/Festive/Singleplayer.webp';
import themesImgFestive from '../assets/themes/Festive/Themes.webp';
import tieImgFestive from '../assets/themes/Festive/Tie.webp';
import winImgFestive from '../assets/themes/Festive/Win.webp';

// Import sound assets
import backgroundSound from '../assets/sounds/background.mp3';
import backgroundFestiveSound from '../assets/sounds/backgroundHalloween.mp3';
import clickSound from '../assets/sounds/click.mp3';
import loseSound from '../assets/sounds/lose.mp3';
import tieSound from '../assets/sounds/tie.mp3';
import winSound from '../assets/sounds/win.mp3';

interface AssetLoadResult {
  success: boolean;
  asset: string;
  error?: string;
}

interface SplashProps {
  onComplete: () => void;
}

export function Splash({ onComplete }: SplashProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [failedAssets, setFailedAssets] = useState<string[]>([]);

  useEffect(() => {
    const preloadAssets = async () => {
      // All image assets from both themes
      const imageAssets = [
        // Default theme
        logo,
        background,
        backImg,
        easyImg,
        hardImg,
        leaderboardImg,
        leaderboardButtonImg,
        loseImg,
        mediumImg,
        multiplayerImg,
        pauseImg,
        playButtonImg,
        playGameTextImg,
        quitImg,
        settingsImg,
        singleplayerImg,
        themesImg,
        tieImg,
        winImg,
        // Festive theme
        logoFestive,
        backgroundFestive,
        backImgFestive,
        easyImgFestive,
        hardImgFestive,
        leaderboardImgFestive,
        leaderboardButtonImgFestive,
        loseImgFestive,
        mediumImgFestive,
        multiplayerImgFestive,
        pauseImgFestive,
        playButtonImgFestive,
        quitImgFestive,
        settingsImgFestive,
        singleplayerImgFestive,
        themesImgFestive,
        tieImgFestive,
        winImgFestive,
      ];

      // All sound assets
      const soundAssets = [
        backgroundSound,
        backgroundFestiveSound,
        clickSound,
        loseSound,
        tieSound,
        winSound,
      ];

      const allAssets = [...imageAssets, ...soundAssets];
      let loadedCount = 0;
      const failed: string[] = [];

      setLoadingStatus('Loading images and sounds...');

      const loadAssetWithRetry = async (src: string, maxRetries = 3): Promise<AssetLoadResult> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await loadSingleAsset(src);
            return { success: true, asset: src };
          } catch (error) {
            if (attempt === maxRetries) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              console.warn(
                `Failed to load asset after ${maxRetries} attempts: ${src}`,
                errorMessage
              );
              return { success: false, asset: src, error: errorMessage };
            }
            // Wait before retry (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, attempt * 500));
          }
        }
        return { success: false, asset: src, error: 'Max retries exceeded' };
      };

      const loadSingleAsset = (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          const isAudio = src.includes('.mp3') || src.includes('sounds/');

          if (isAudio) {
            // Load audio asset
            const audio = new Audio(src);

            const onLoad = () => {
              cleanup();
              resolve();
            };

            const onError = () => {
              cleanup();
              reject(new Error(`Audio load failed: ${src}`));
            };

            const cleanup = () => {
              audio.removeEventListener('canplaythrough', onLoad);
              audio.removeEventListener('loadeddata', onLoad);
              audio.removeEventListener('error', onError);
            };

            audio.addEventListener('canplaythrough', onLoad);
            audio.addEventListener('loadeddata', onLoad);
            audio.addEventListener('error', onError);

            // Set timeout for audio loading
            setTimeout(() => {
              cleanup();
              reject(new Error(`Audio load timeout: ${src}`));
            }, 10000);

            audio.load();
          } else {
            // Load image asset
            const img = new Image();

            img.onload = () => {
              resolve();
            };

            img.onerror = () => {
              reject(new Error(`Image load failed: ${src}`));
            };

            // Set timeout for image loading
            setTimeout(() => {
              reject(new Error(`Image load timeout: ${src}`));
            }, 10000);

            img.src = src;
          }
        });
      };

      const updateProgress = () => {
        loadedCount++;
        const progress = (loadedCount / allAssets.length) * 100;
        setLoadingProgress(progress);

        if (loadedCount === allAssets.length) {
          if (failed.length > 0) {
            setLoadingStatus(
              `Loaded ${allAssets.length - failed.length}/${allAssets.length} assets`
            );
            setFailedAssets(failed);
          } else {
            setLoadingStatus('All assets loaded successfully!');
          }
        }
      };

      try {
        // Load all assets with retry mechanism
        const results = await Promise.allSettled(
          allAssets.map(async (asset) => {
            const result = await loadAssetWithRetry(asset);
            updateProgress();

            if (!result.success) {
              failed.push(result.asset);
            }

            return result;
          })
        );

        // Log loading summary
        const successful = results.filter((r) => r.status === 'fulfilled').length;
        console.log(
          `Asset loading complete: ${successful}/${allAssets.length} assets loaded successfully`
        );

        if (failed.length > 0) {
          console.warn('Failed to load assets:', failed);
        }

        // Minimum loading time for smooth experience
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setLoadingStatus('Ready to play!');
        
        // Enable audio automatically when loading is complete (100%)
        enableAudio();
        
        setIsLoading(false);

        // Smooth transition to dashboard
        setTimeout(() => {
          onComplete();
        }, 500);
      } catch (error) {
        console.error('Critical error during asset loading:', error);
        setLoadingStatus('Loading completed with errors');
        setIsLoading(false);

        setTimeout(() => {
          onComplete();
        }, 500);
      }
    };

    preloadAssets();
  }, [onComplete]);

  const { assets } = useTheme();

  return (
    <div className="w-full h-screen flex items-center justify-center overflow-hidden" style={{ backgroundImage: `url(${assets.background})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="animate-bounce px-2">
          <img src={assets.logo} alt="Word Duel" className="w-48 max-w-full drop-shadow-2xl" />
        </div>

        {isLoading && (
          <div className="flex flex-col items-center gap-3 w-64">
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-white text-lg font-bold">{Math.round(loadingProgress)}%</p>
              <p className="text-white/80 text-sm font-medium">{loadingStatus}</p>
              {failedAssets.length > 0 && (
                <p className="text-yellow-300 text-xs mt-1">
                  {failedAssets.length} assets failed to load
                </p>
              )}
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="flex flex-col items-center gap-2 animate-fade-in">
            <div className="w-64 rounded-full h-3 overflow-hidden backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full w-full" style={{ backgroundImage: 'linear-gradient(to right, var(--bg-from), var(--bg-to))' }} />
            </div>
            <p className="text-[var(--primary)] text-lg font-bold">Ready to Play!</p>
            <p className="text-[var(--muted)] text-xs">Transitioning to game...</p>
          </div>
        )}
      </div>
    </div>
  );
}
