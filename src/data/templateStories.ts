import { type Scene } from '../types';

export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  genre: string;
  startSceneId: string;
  scenes: Record<string, Scene>;
}

// The Mysterious Portal - Fantasy Adventure
export const mysteriousPortalStory: StoryTemplate = {
  id: 'mysterious-portal',
  name: 'The Mysterious Portal',
  description: 'Discover a magical gateway to another realm filled with wonder and danger.',
  genre: 'fantasy',
  startSceneId: 'portal-intro',
  scenes: {
    'portal-intro': {
      id: 'portal-intro',
      title: 'The Mysterious Portal',
      content: `<p>You stand before an ancient stone archway, its surface covered in glowing runes that pulse with an otherworldly light. The air shimmers within the portal's frame, revealing glimpses of a vast forest beyond—but this is no ordinary woodland. The trees seem to whisper secrets, and strange creatures flit between the shadows.</p>

<p>Your heart races as you realize this is the discovery of a lifetime. The portal matches descriptions from the old texts you've been studying, legends of gateways to the Realm of Echoes, where every choice creates ripples across reality.</p>

<p>Behind you, the familiar sounds of your world fade away. Ahead lies the unknown, filled with both wonder and danger.</p>`,
      choices: [
        {
          id: 'step-through',
          text: 'Step through the portal boldly',
          consequence: 'Embracing courage, but risking the unknown',
          nextSceneId: 'forest-arrival',
          impact: { narrative: 8, character: 6, world: 7 }
        },
        {
          id: 'study-runes',
          text: 'Study the runes carefully first',
          consequence: 'Gaining knowledge, but time may be running out',
          nextSceneId: 'rune-discovery',
          impact: { narrative: 6, character: 8, world: 5 }
        },
        {
          id: 'call-out',
          text: 'Call out to see if anyone responds',
          consequence: 'Seeking allies, but possibly alerting enemies',
          nextSceneId: 'mysterious-voice',
          impact: { narrative: 7, character: 5, world: 8 }
        }
      ],
      entities: [
        {
          id: 'portal',
          name: 'Ancient Portal',
          type: 'location',
          properties: { magical: true, dangerous: true }
        }
      ],
      metadata: {
        genre: 'fantasy',
        tone: 'mysterious',
        themes: ['discovery', 'courage', 'choice'],
        estimatedReadTime: 2
      }
    },
    'forest-arrival': {
      id: 'forest-arrival',
      title: 'Into the Unknown',
      content: `<p>You take a deep breath and step through the portal. The sensation is like diving into cool water—a moment of disorientation, then clarity. You emerge in a forest unlike any you've ever seen. The trees tower impossibly high, their leaves shimmering with an inner light. The air tastes of honey and storms.</p>

<p>A path winds between the massive trunks, marked by stones that glow faintly in the eternal twilight of this realm. In the distance, you hear the sound of running water and... is that music?</p>

<p>Behind you, the portal still shimmers, offering a way back. But something about this place calls to you, urging you deeper into its mysteries.</p>`,
      choices: [
        {
          id: 'follow-path',
          text: 'Follow the glowing path',
          consequence: 'Trust in the ancient markers',
          nextSceneId: 'crystal-clearing',
          impact: { narrative: 7, character: 5, world: 6 }
        },
        {
          id: 'investigate-music',
          text: 'Head toward the mysterious music',
          consequence: 'Let curiosity guide you',
          nextSceneId: 'fairy-grove',
          impact: { narrative: 8, character: 6, world: 7 }
        },
        {
          id: 'return-portal',
          text: 'Return through the portal while you can',
          consequence: 'Choose safety over adventure',
          nextSceneId: 'safe-return',
          impact: { narrative: 3, character: 2, world: 1 }
        }
      ],
      entities: [
        {
          id: 'echo-forest',
          name: 'Forest of Echoes',
          type: 'location',
          properties: { magical: true, vast: true, alive: true }
        }
      ],
      metadata: {
        genre: 'fantasy',
        tone: 'wondrous',
        themes: ['exploration', 'mystery', 'choice'],
        estimatedReadTime: 2
      }
    },
    'rune-discovery': {
      id: 'rune-discovery',
      title: 'Ancient Knowledge',
      content: `<p>You trace your fingers near the glowing runes, careful not to touch them directly. Years of study have taught you caution. As you examine the symbols, patterns emerge—this is the ancient script of the Architects, the beings who supposedly created pathways between worlds.</p>

<p>The runes speak of a warning: "Only those who embrace change may walk between worlds without losing themselves." Another section mentions guardians who test travelers, and treasures beyond imagination for those who prove worthy.</p>

<p>As you decipher the final symbol, the portal's glow intensifies. You've activated something. The gateway seems more inviting now, but also more ominous.</p>`,
      choices: [
        {
          id: 'enter-prepared',
          text: 'Enter the portal with newfound knowledge',
          consequence: 'Wisdom guides your journey',
          nextSceneId: 'prepared-arrival',
          impact: { narrative: 8, character: 9, world: 6 }
        },
        {
          id: 'search-more',
          text: 'Search for more clues nearby',
          consequence: 'Thorough preparation, but time passes',
          nextSceneId: 'hidden-journal',
          impact: { narrative: 6, character: 7, world: 5 }
        },
        {
          id: 'share-discovery',
          text: 'Return to town to share your discovery',
          consequence: 'Seek help from others',
          nextSceneId: 'town-council',
          impact: { narrative: 5, character: 4, world: 8 }
        }
      ],
      entities: [
        {
          id: 'architect-runes',
          name: 'Architect Runes',
          type: 'item',
          properties: { ancient: true, powerful: true, warning: true }
        }
      ],
      metadata: {
        genre: 'fantasy',
        tone: 'scholarly',
        themes: ['knowledge', 'preparation', 'wisdom'],
        estimatedReadTime: 2
      }
    },
    'mysterious-voice': {
      id: 'mysterious-voice',
      title: 'An Unexpected Response',
      content: `<p>"Who dares disturb the threshold between worlds?" The voice seems to come from everywhere and nowhere at once, resonating through the very stones of the portal. It's neither hostile nor welcoming, but filled with an ancient weariness.</p>

<p>A figure materializes within the portal's shimmer—translucent, shifting, not quite human. Its features are hard to focus on, as if your eyes refuse to fully comprehend what they're seeing.</p>

<p>"I am the Keeper of this passage," the being continues. "Many have come before you. Some sought power, others knowledge, a few merely adventure. What is it you seek, traveler?"</p>`,
      choices: [
        {
          id: 'seek-knowledge',
          text: 'I seek knowledge of other worlds',
          consequence: 'The path of the scholar',
          nextSceneId: 'keeper-test-knowledge',
          impact: { narrative: 7, character: 8, world: 6 }
        },
        {
          id: 'seek-adventure',
          text: 'I seek adventure and new experiences',
          consequence: 'The path of the explorer',
          nextSceneId: 'keeper-test-courage',
          impact: { narrative: 8, character: 7, world: 7 }
        },
        {
          id: 'seek-purpose',
          text: 'I seek my true purpose',
          consequence: 'The path of destiny',
          nextSceneId: 'keeper-test-soul',
          impact: { narrative: 9, character: 9, world: 8 }
        }
      ],
      entities: [
        {
          id: 'portal-keeper',
          name: 'The Keeper',
          type: 'character',
          properties: { ancient: true, neutral: true, powerful: true, guardian: true }
        }
      ],
      metadata: {
        genre: 'fantasy',
        tone: 'mystical',
        themes: ['purpose', 'testing', 'guidance'],
        estimatedReadTime: 2
      }
    },
    // Endpoint scenes
    'safe-return': {
      id: 'safe-return',
      title: 'The Wise Retreat',
      content: `<p>Sometimes discretion truly is the better part of valor. You step back through the portal, feeling the familiar world embrace you once more. The sun seems brighter, the air more crisp and real.</p>

<p>The portal remains, waiting. Perhaps one day, when you're better prepared, you'll return. For now, you have an incredible tale to tell and the knowledge that other worlds exist just beyond the threshold.</p>

<p>Your adventure ends here, but the memory of what could have been will stay with you forever.</p>`,
      choices: [
        {
          id: 'new-game',
          text: 'Begin a new adventure',
          consequence: 'Start fresh with new choices',
          impact: { narrative: 0, character: 0, world: 0 }
        }
      ],
      entities: [],
      metadata: {
        genre: 'fantasy',
        tone: 'contemplative',
        themes: ['wisdom', 'safety', 'potential'],
        estimatedReadTime: 1
      }
    }
  }
};

// The Space Station Mystery - Sci-Fi Thriller
export const spaceStationStory: StoryTemplate = {
  id: 'space-station',
  name: 'Echoes in the Void',
  description: 'Investigate a mysteriously silent space station on the edge of known space.',
  genre: 'sci-fi',
  startSceneId: 'arrival',
  scenes: {
    'arrival': {
      id: 'arrival',
      title: 'Silent Station',
      content: `<p>Your shuttle docks with Kepler Station after receiving no response to your hails. As the senior investigator for the Colonial Authority, you've seen your share of technical failures, but this feels different. The station's lights are on, life support is functioning, but there's no sign of the 847 crew members.</p>

<p>Your scanner shows no immediate threats, but also no life signs. The docking bay is eerily pristine, as if the crew simply vanished mid-shift. A datapad lies abandoned on a crate, its screen still displaying a half-written message: "They're not who they seem to—"</p>

<p>Three paths lead from the docking bay: the command center, the research labs, and the crew quarters.</p>`,
      choices: [
        {
          id: 'command-center',
          text: 'Head to the command center',
          consequence: 'Seek answers from the station\'s systems',
          nextSceneId: 'command-discovery',
          impact: { narrative: 7, character: 6, world: 8 }
        },
        {
          id: 'research-labs',
          text: 'Investigate the research labs',
          consequence: 'Uncover what they were working on',
          nextSceneId: 'lab-horror',
          impact: { narrative: 8, character: 5, world: 9 }
        },
        {
          id: 'crew-quarters',
          text: 'Search the crew quarters',
          consequence: 'Look for personal clues',
          nextSceneId: 'personal-mystery',
          impact: { narrative: 6, character: 8, world: 6 }
        }
      ],
      entities: [
        {
          id: 'kepler-station',
          name: 'Kepler Station',
          type: 'location',
          properties: { abandoned: true, mysterious: true, functioning: true }
        }
      ],
      metadata: {
        genre: 'sci-fi',
        tone: 'suspenseful',
        themes: ['mystery', 'isolation', 'investigation'],
        estimatedReadTime: 2
      }
    }
  }
};

// The Lost Heir - Medieval Political Intrigue
export const lostHeirStory: StoryTemplate = {
  id: 'lost-heir',
  name: 'Crown of Shadows',
  description: 'Navigate court intrigue as you discover your true royal heritage.',
  genre: 'medieval',
  startSceneId: 'revelation',
  scenes: {
    'revelation': {
      id: 'revelation',
      title: 'The Secret Revealed',
      content: `<p>The dying woman's grip on your hand is surprisingly strong. "You are not who you think you are," she whispers, her eyes bright with urgency. This woman who raised you, who you've called mother for eighteen years, now reveals the truth with her final breaths.</p>

<p>"You are the lost heir of Aldermore, hidden away when your parents were murdered. The usurper sits on your throne, but the royal seal—" she presses a heavy ring into your palm, "—this will prove your claim."</p>

<p>As her eyes close for the last time, you're left with a choice that will change everything. Outside, you hear horses approaching—the local lord's men, coming to collect taxes from your humble farm.</p>`,
      choices: [
        {
          id: 'confront-soldiers',
          text: 'Confront the soldiers with your new identity',
          consequence: 'Risk everything on the truth',
          nextSceneId: 'bold-declaration',
          impact: { narrative: 9, character: 7, world: 8 }
        },
        {
          id: 'hide-ring',
          text: 'Hide the ring and maintain your disguise',
          consequence: 'Play the long game',
          nextSceneId: 'secret-keeper',
          impact: { narrative: 6, character: 8, world: 5 }
        },
        {
          id: 'flee-immediately',
          text: 'Flee before the soldiers arrive',
          consequence: 'Seek allies elsewhere',
          nextSceneId: 'night-escape',
          impact: { narrative: 7, character: 6, world: 7 }
        }
      ],
      entities: [
        {
          id: 'royal-seal',
          name: 'Royal Seal of Aldermore',
          type: 'item',
          properties: { powerful: true, proof: true, dangerous: true }
        }
      ],
      metadata: {
        genre: 'medieval',
        tone: 'dramatic',
        themes: ['identity', 'power', 'destiny'],
        estimatedReadTime: 2
      }
    }
  }
};

// Template story collection
export const templateStories: StoryTemplate[] = [
  mysteriousPortalStory,
  spaceStationStory,
  lostHeirStory
];

export const getTemplateStory = (id: string): StoryTemplate | undefined => {
  return templateStories.find(story => story.id === id);
};

export const getScene = (storyId: string, sceneId: string): Scene | undefined => {
  const story = getTemplateStory(storyId);
  return story?.scenes[sceneId];
};