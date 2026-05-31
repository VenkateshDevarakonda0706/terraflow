import { ExploreCategoryId } from './constants.js';

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

export interface WSPayloadMap {
  'notification:new': {
    id: string;
    type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'CAPSULE_UNLOCK' | 'SYSTEM';
    title: string;
    message: string;
    referenceId?: string;
    createdAt: string;
  };
  'chat:message': {
    id: string;
    senderId: string;
    senderUsername: string;
    senderName: string;
    content: string;
    createdAt: string;
  };
  'friend:location': {
    userId: string;
    username: string;
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
}

export interface PostDetailsDto {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  h3Index: string;
  tags: string[];
  visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  createdAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    profilePic?: string;
  };
  media: {
    id: string;
    url: string;
    type: 'IMAGE' | 'VIDEO';
    order: number;
  }[];
}

export interface SpatialExploreQuery {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  zoomLevel: number;
  category?: ExploreCategoryId;
}
