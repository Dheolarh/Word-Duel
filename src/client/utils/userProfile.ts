// User profile utilities for Reddit integration

export interface UserProfile {
  userId: string;
  username: string;
  profilePicture: string;
  isRedditProfile: boolean;
}

// Cache for user profile to avoid repeated API calls
let cachedProfile: UserProfile | null = null;

/**
 * Fetches the current user's Reddit profile information
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  // Return cached profile if available
  if (cachedProfile !== null) {
    return cachedProfile;
  }
  
  try {
  const response = await fetch('/api/get-user-profile', { cache: 'no-store' });
    const result = await response.json();
    
    if (result.success && result.data?.profile) {
      const profile = result.data.profile;
      cachedProfile = profile;
      return profile;
    } else {
      throw new Error(result.error || 'Failed to fetch user profile');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Try server-side assigned anon name as a fallback
    try {
      const resp = await fetch('/api/get-anon-name');
      if (resp.ok) {
        const json = await resp.json();
        if (json.success && json.data?.anonName) {
          const anonProfile: UserProfile = {
            userId: 'unknown',
            username: json.data.anonName,
            profilePicture: getDefaultProfileIcon(),
            isRedditProfile: false
          };
          cachedProfile = anonProfile;
          return anonProfile;
        }
      }
    } catch (e) {
      // ignore
    }
    // Try to extract Devvit-provided context from the URL as a fallback.
    // The playtest webview often includes a `context=` query parameter with JSON
    // that can contain userId and subreddit information. Use it when the
    // server endpoint is unreachable (404 from devvit proxy).
    try {
      const params = new URLSearchParams(window.location.search);
      const ctx = params.get('context');
      if (ctx) {
        try {
          const parsed = JSON.parse(decodeURIComponent(ctx));
          const maybeUserId = parsed.userId || parsed.devvitUserId || parsed.user?.id;
          const maybeUsername = parsed.username || parsed.user?.username || undefined;
          if (maybeUserId) {
            const fallbackFromContext: UserProfile = {
              userId: maybeUserId,
              username: maybeUsername || 'Player',
              profilePicture: getDefaultProfileIcon(),
              isRedditProfile: false
            };
            cachedProfile = fallbackFromContext;
            return fallbackFromContext;
          }
        } catch (e) {
          // ignore parse errors and continue to final fallback
        }
      }
    } catch (e) {
      // ignore URL parsing errors
    }

    // Return fallback profile
    // Ensure we generate a stable anonymous id per browser so different clients
    // on the same machine keep the same id, but different browsers/devices get
    // unique ids. This prevents multiple anonymous players from colliding
    // with the same 'unknown' id in matchmaking.
    let anonId = 'unknown';
    try {
      const storageKey = 'words_duel_anon_id';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        anonId = stored;
      } else {
        // Use crypto.randomUUID when available, fallback to timestamp+random
        const gen = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
          ? (crypto as any).randomUUID()
          : `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        anonId = gen;
        try { localStorage.setItem(storageKey, anonId); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      // localStorage might be unavailable in some embedded contexts; fallback
      anonId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    const fallbackProfile: UserProfile = {
      userId: anonId,
      username: 'Anonymous',
      profilePicture: getDefaultProfileIcon(),
      isRedditProfile: false
    };

    return fallbackProfile;
  }
}

/**
 * Generates a profile picture URL with fallback options
 */
export function getProfilePictureUrl(_username: string, redditProfileUrl?: string): string {
  if (redditProfileUrl) {
    return redditProfileUrl;
  }
  
  // Fallback to a simple profile icon
  return getDefaultProfileIcon();
}

/**
 * Gets a default profile icon for users
 */
export function getDefaultProfileIcon(): string {
  // Use a simple, generic profile icon
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM0YTliM2MiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiA1MmMwLTguODM3IDcuMTYzLTE2IDE2LTE2czE2IDcuMTYzIDE2IDE2djEySDEyVjUyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
}

/**
 * Clears the cached profile (useful for testing or when user changes)
 */
export function clearProfileCache(): void {
  cachedProfile = null;
}

/**
 * Gets a profile picture for AI opponents
 */
export function getAIProfilePicture(): string {
  // Use Reddit mascot for AI opponents
  return 'https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png';
}
