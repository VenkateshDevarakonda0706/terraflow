export const EXPLORE_CATEGORIES = [
  { id: 'nature', label: 'Nature', icon: 'Trees' },
  { id: 'food', label: 'Food', icon: 'Utensils' },
  { id: 'travel', label: 'Travel', icon: 'Plane' },
  { id: 'history', label: 'History', icon: 'Hourglass' },
  { id: 'architecture', label: 'Architecture', icon: 'Building' },
  { id: 'festivals', label: 'Festivals', icon: 'Sparkles' },
  { id: 'wildlife', label: 'Wildlife', icon: 'Bird' },
  { id: 'nightlife', label: 'Nightlife', icon: 'Moon' }
] as const;

export type ExploreCategoryId = typeof EXPLORE_CATEGORIES[number]['id'];

export const TRAVEL_BADGES = {
  GLOBETROTTER: {
    id: 'GLOBETROTTER',
    name: 'Globetrotter',
    description: 'Visited at least 5 different countries.',
    requirement: 5,
  },
  EXPLORER: {
    id: 'EXPLORER',
    name: 'Avid Explorer',
    description: 'Logged posts in at least 10 different cities.',
    requirement: 10,
  },
  MILESTONE_1000K: {
    id: 'MILESTONE_1000K',
    name: '1000K Voyager',
    description: 'Traveled a cumulative distance of over 1000 kilometers.',
    requirement: 1000,
  },
  TIME_TRAVELER: {
    id: 'TIME_TRAVELER',
    name: 'Time Traveler',
    description: 'Unlocked your first digital Memory Capsule.',
    requirement: 1,
  }
} as const;

export type TravelBadgeId = keyof typeof TRAVEL_BADGES;
