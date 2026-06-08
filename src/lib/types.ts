export type PackageType = 'Iron' | 'Gold' | 'Diamond';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  package: PackageType;
  isBanned: boolean;
  plainPassword?: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string;
  pin?: string;
  favorites?: { id: string; type: 'movie' | 'series' }[];
  progress?: { videoId: string; type: 'movie' | 'episode'; time: number; duration?: number; lastWatched: string }[];
  readNotifications?: string[];
  preferences?: {
    audio?: 'tr' | 'en';
    subtitle?: 'off' | 'tr' | 'en';
    subColor?: string;
    subSize?: string;
  };
}

export interface ActiveSession {
  userId: string;
  profileId: string;
  ipAddress: string;
  lastActive: string;
  watchingType?: 'movie' | 'series';
  watchingId?: string;
}

export interface CastMember {
  name: string;
  photoUrl: string;
  role: string;
}

export interface Movie {
  id: string;
  title: string;
  type: string;
  story: string;
  bannerUrl: string;
  videoUrl: string;
  videoUrlEN?: string;
  subtitleTR?: string;
  subtitleEN?: string;
  categories?: string[];
  year?: number;
  imdbRating?: number;
  director?: string;
  cast?: CastMember[];
}

export interface Series {
  id: string;
  title: string;
  story: string;
  bannerUrl: string;
  categories?: string[];
  year?: number;
  imdbRating?: number;
  director?: string;
  cast?: CastMember[];
}

export interface Episode {
  id: string;
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  videoUrlEN?: string;
  subtitleTR?: string;
  subtitleEN?: string;
}

export interface Channel {
  id: string;
  name: string;
  logoUrl?: string;
  streamUrl: string;
}

export interface LivePlaylist {
  id: string;
  name: string;
  url: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  targetPackage?: 'All' | 'Iron' | 'Gold' | 'Diamond';
  link?: string;
}

export interface Database {
  users: User[];
  profiles: Profile[];
  activeSessions: ActiveSession[];
  movies: Movie[];
  series: Series[];
  episodes: Episode[];
  channels?: Channel[];
  livePlaylists?: LivePlaylist[];
  dailyGoldSeries: {
    date: string;
    seriesIds: string[];
  };
  notifications?: Notification[];
}
