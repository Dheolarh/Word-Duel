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
    const response = await fetch('/api/get-user-profile');
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
    
    // Return fallback profile
    const fallbackProfile: UserProfile = {
      userId: 'unknown',
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
