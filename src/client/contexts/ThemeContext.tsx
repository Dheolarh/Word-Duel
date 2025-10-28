import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { playBackgroundMusic } from '../utils/sound';

// Import theme assets (Default + Festive)
import logoDefault from '../assets/themes/Default/Logo.webp';
import logoFestive from '../assets/themes/Festive/Logo.webp';
import backgroundDefault from '../assets/themes/Default/Background.webp';
import backgroundFestive from '../assets/themes/Festive/Background.webp';
import leaderboardIconDefault from '../assets/themes/Default/LeaderboardButton.webp';
import leaderboardIconFestive from '../assets/themes/Festive/LeaderboardButton.webp';
import settingsIconDefault from '../assets/themes/Default/Settings.webp';
import settingsIconFestive from '../assets/themes/Festive/Settings.webp';
import musicIconDefault from '../assets/themes/Default/Music.webp';
import musicIconFestive from '../assets/themes/Festive/Music.webp';
import tutorialIconDefault from '../assets/themes/Default/Tutorial.webp';
import tutorialIconFestive from '../assets/themes/Festive/Tutorial.webp';
import playIconDefault from '../assets/themes/Default/PlayButton.webp';
import playIconFestive from '../assets/themes/Festive/PlayButton.webp';
import backDefault from '../assets/themes/Default/Back.webp';
import backFestive from '../assets/themes/Festive/Back.webp';
import singleplayerDefault from '../assets/themes/Default/Singleplayer.webp';
import singleplayerFestive from '../assets/themes/Festive/Singleplayer.webp';
import multiplayerDefault from '../assets/themes/Default/Multiplayer.webp';
import multiplayerFestive from '../assets/themes/Festive/Multiplayer.webp';
import pauseDefault from '../assets/themes/Default/Pause.webp';
import pauseFestive from '../assets/themes/Festive/Pause.webp';
import quitDefault from '../assets/themes/Default/Quit.webp';
import quitFestive from '../assets/themes/Festive/Quit.webp';
import easyDefault from '../assets/themes/Default/Easy.webp';
import easyFestive from '../assets/themes/Festive/Easy.webp';
import mediumDefault from '../assets/themes/Default/Medium.webp';
import mediumFestive from '../assets/themes/Festive/Medium.webp';
import hardDefault from '../assets/themes/Default/Hard.webp';
import hardFestive from '../assets/themes/Festive/Hard.webp';
import loseDefault from '../assets/themes/Default/Lose.webp';
import loseFestive from '../assets/themes/Festive/Lose.webp';
import tieDefault from '../assets/themes/Default/Tie.webp';
import tieFestive from '../assets/themes/Festive/Tie.webp';
import winDefault from '../assets/themes/Default/Win.webp';
import winFestive from '../assets/themes/Festive/Win.webp';
import playGameTextDefault from '../assets/themes/Default/PlayGameText.webp';
import leaderboardHeaderDefault from '../assets/themes/Default/Leaderboard.webp';
import leaderboardHeaderFestive from '../assets/themes/Festive/Leaderboard.webp';
import themesHeaderDefault from '../assets/themes/Default/Themes.webp';
import themesHeaderFestive from '../assets/themes/Festive/Themes.webp';

interface ThemeAssets {
  logo: string;
  background: string;
  leaderboardIcon: string;
  settingsIcon: string;
  musicIcon: string;
  tutorialIcon: string;
  playIcon: string;
  playGameText: string;
  leaderboardHeader: string;
  themesHeader: string;
  back: string;
  easy: string;
  medium: string;
  hard: string;
  singleplayer: string;
  multiplayer: string;
  pause: string;
  quit: string;
  lose: string;
  tie: string;
  win: string;
}

export type ThemeName = 'green' | 'Festive';

type FestivalName = 'halloween' | 'none';

interface FestivalColors {
  modalBg: string;
  modalText: string;
}

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  currentFestival: FestivalName;
  festivalColors: FestivalColors;
  assets: ThemeAssets;
  allAssets: Record<ThemeName, ThemeAssets>;
  allTokens: Record<ThemeName, { border: string; primary: string; primaryDark: string; bgFrom: string; bgTo: string; onPrimary: string }>;
}

const defaultFestivalColors: FestivalColors = {
  modalBg: '#ffffff',
  modalText: '#111827',
};

const FESTIVAL_COLOR_MAP: Record<FestivalName, FestivalColors> = {
  // Halloween: purple background, orange text (simple, configurable)
  halloween: {
    modalBg: '#4B0082', // indigo/purple
    modalText: '#FFA500', // orange
  },
  none: defaultFestivalColors,
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeName>(() => {
    // Read saved theme from localStorage if available
    try {
      const raw = localStorage.getItem('wordDuelTheme');
      if (raw === 'Festive') return 'Festive';
    } catch (e) {
      // ignore
    }
    return 'green';
  });

  // Current festival - keep simple: default to halloween as the current festival
  const [currentFestival] = useState<FestivalName>('halloween');

  const festivalColors = useMemo(() => {
    // Only return festival colors when Festive theme is active
    if (theme === 'Festive') {
      return FESTIVAL_COLOR_MAP[currentFestival] ?? defaultFestivalColors;
    }
    return defaultFestivalColors;
  }, [currentFestival, theme]);

  // Persist theme and change background music variant when theme changes
  useEffect(() => {
    try {
      localStorage.setItem('wordDuelTheme', theme);
    } catch (e) {
      // ignore
    }

    // Switch background music variant based on theme selection, but only if the
    // user has background music enabled. We check persisted audio settings
    // from localStorage to avoid unintentional playback when the user has
    // explicitly disabled music.
    try {
      const audioSettingsRaw = localStorage.getItem('wordDuelAudioSettings');
      const audioSettings = audioSettingsRaw ? JSON.parse(audioSettingsRaw) : null;
      const bgEnabled = audioSettings ? !!audioSettings.backgroundMusicEnabled : true;
      if (bgEnabled) {
        if (theme === 'Festive') {
          playBackgroundMusic('festive').catch(() => {});
        } else {
          playBackgroundMusic('default').catch(() => {});
        }
      }
    } catch (e) {
      // ignore JSON parse errors or localStorage issues
    }

    // Also expose festival colors and theme via CSS variables and data attribute so
    // other components / CSS can react to theme changes without editing many files.
    try {
      const root = document.documentElement;
      root.dataset.theme = theme.toLowerCase();
        const colors = theme === 'Festive' ? (FESTIVAL_COLOR_MAP[currentFestival] ?? defaultFestivalColors) : defaultFestivalColors;
        root.style.setProperty('--modal-bg', colors.modalBg);
        root.style.setProperty('--modal-text', colors.modalText);

        // Theme tokens for general UI colors
        const defaultTokens = {
          primary: '#2d5016',
          primaryDark: '#1a2f0a',
          border: '#4a9b3c',
          bgFrom: '#e8f5e3',
          bgTo: '#d4ead0',
          muted: '#6b7280',
          onPrimary: '#ffffff'
        };

        const festiveTokens = {
          primary: '#4B0082', // purple-ish
          primaryDark: '#3a0068',
          border: '#FFA500', // orange as accent
          bgFrom: '#f3e8ff',
          bgTo: '#fde8d6',
          muted: '#e5d4ff',
          onPrimary: '#FFA500'
        };

        const tokens = theme === 'Festive' ? festiveTokens : defaultTokens;
        root.style.setProperty('--primary', tokens.primary);
        root.style.setProperty('--primary-dark', tokens.primaryDark);
        root.style.setProperty('--border-color', tokens.border);
        root.style.setProperty('--bg-from', tokens.bgFrom);
        root.style.setProperty('--bg-to', tokens.bgTo);
        root.style.setProperty('--muted', tokens.muted);
        root.style.setProperty('--on-primary', tokens.onPrimary);
        // Expose an app-wide text color variable and set document text color for easy theming
        // Festive mode will set text to the theme primary (purple); default uses a sensible dark color
        const appText = theme === 'Festive' ? tokens.primary : '#111827';
        root.style.setProperty('--app-text', appText);
        try {
          // Also set the document's base color so `text-current` and inherited text use the right color
          document.documentElement.style.color = appText;
        } catch (e) {
          // ignore
        }
    } catch (e) {
      // ignore (server-side rendering or unavailable document)
    }
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    setTheme,
    currentFestival,
    festivalColors,
    assets: useMemo(() => (theme === 'Festive' ? {
      logo: logoFestive,
      background: backgroundFestive,
      leaderboardIcon: leaderboardIconFestive,
      settingsIcon: settingsIconFestive,
      musicIcon: musicIconFestive,
      tutorialIcon: tutorialIconFestive,
      playIcon: playIconFestive,
      playGameText: playGameTextDefault,
      leaderboardHeader: leaderboardHeaderFestive,
      themesHeader: themesHeaderFestive,
      back: backFestive,
  easy: easyFestive,
  medium: mediumFestive,
  hard: hardFestive,
      singleplayer: singleplayerFestive,
      multiplayer: multiplayerFestive,
      pause: pauseFestive,
      quit: quitFestive,
      lose: loseFestive,
      tie: tieFestive,
      win: winFestive,
    } : {
      logo: logoDefault,
      background: backgroundDefault,
      leaderboardIcon: leaderboardIconDefault,
      settingsIcon: settingsIconDefault,
      musicIcon: musicIconDefault,
      tutorialIcon: tutorialIconDefault,
      playIcon: playIconDefault,
      playGameText: playGameTextDefault,
      leaderboardHeader: leaderboardHeaderDefault,
      themesHeader: themesHeaderDefault,
      back: backDefault,
  easy: easyDefault,
  medium: mediumDefault,
  hard: hardDefault,
      singleplayer: singleplayerDefault,
      multiplayer: multiplayerDefault,
      pause: pauseDefault,
      quit: quitDefault,
      lose: loseDefault,
      tie: tieDefault,
      win: winDefault,
    }), [theme]),
    allAssets: useMemo(() => ({
      green: {
        logo: logoDefault,
        background: backgroundDefault,
        leaderboardIcon: leaderboardIconDefault,
        settingsIcon: settingsIconDefault,
        musicIcon: musicIconDefault,
        tutorialIcon: tutorialIconDefault,
        playIcon: playIconDefault,
        playGameText: playGameTextDefault,
        leaderboardHeader: leaderboardHeaderDefault,
        themesHeader: themesHeaderDefault,
        back: backDefault,
  easy: easyDefault,
  medium: mediumDefault,
  hard: hardDefault,
        singleplayer: singleplayerDefault,
        multiplayer: multiplayerDefault,
        pause: pauseDefault,
        quit: quitDefault,
        lose: loseDefault,
        tie: tieDefault,
        win: winDefault,
      },
      Festive: {
        logo: logoFestive,
        background: backgroundFestive,
        leaderboardIcon: leaderboardIconFestive,
        settingsIcon: settingsIconFestive,
        musicIcon: musicIconFestive,
        tutorialIcon: tutorialIconFestive,
        playIcon: playIconFestive,
        playGameText: playGameTextDefault,
        leaderboardHeader: leaderboardHeaderFestive,
        themesHeader: themesHeaderFestive,
        back: backFestive,
  easy: easyFestive,
  medium: mediumFestive,
  hard: hardFestive,
        singleplayer: singleplayerFestive,
        multiplayer: multiplayerFestive,
        pause: pauseFestive,
        quit: quitFestive,
        lose: loseFestive,
        tie: tieFestive,
        win: winFestive,
      }
    }), []),
    allTokens: useMemo(() => ({
      green: {
        border: '#4a9b3c',
        primary: '#2d5016',
        primaryDark: '#1a2f0a',
        bgFrom: '#e8f5e3',
        bgTo: '#d4ead0',
        onPrimary: '#ffffff'
      },
      Festive: {
        border: '#FFA500',
        primary: '#4B0082',
        primaryDark: '#3a0068',
        bgFrom: '#f3e8ff',
        bgTo: '#fde8d6',
        onPrimary: '#FFA500'
      }
    }), []),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

export default ThemeProvider;
