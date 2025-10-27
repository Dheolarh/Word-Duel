import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }
  const splash = {
    appDisplayName: 'Word Duel',
    backgroundUri: 'default-splash.png',
    buttonLabel: 'Duel ⚔',
    entryUri: 'index.html',
    appIconUri: 'default-icon.png',
  };

  const title = 'Word Duel - Battle of Words!';

  try {
    const post = await reddit.submitCustomPost({
      splash,
      postData: {
        gameState: 'initial',
        score: 0,
      },
      subredditName: subredditName,
      title,
    });

    return post;
  } catch (err) {
    // Log full error to help debugging; rethrow so caller can return a 400/500 appropriately
    console.error('Error submitting custom post:', err);
    throw err;
  }
};
