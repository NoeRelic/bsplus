import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  twoFactorSecret: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  package: { type: String, enum: ['Iron', 'Gold', 'Diamond'], default: 'Iron' },
  isBanned: { type: Boolean, default: false },
  plainPassword: { type: String },
  isTrial: { type: Boolean, default: false },
  trialExpiresAt: { type: String }, // ISO Date string
  createdAt: { type: String, required: true },
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Coupon Schema
const CouponSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  package: { type: String, enum: ['Iron', 'Gold', 'Diamond'], default: 'Diamond' },
  durationDays: { type: Number, required: true },
  maxUses: { type: Number, default: 1 },
  currentUses: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdAt: { type: String, required: true }
});

export const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

// Profile Schema
const ProfileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  pin: { type: String },
  favorites: [{
    id: String,
    type: { type: String, enum: ['movie', 'series'] }
  }],
  progress: [{
    videoId: String,
    type: { type: String, enum: ['movie', 'episode'] },
    time: Number,
    duration: Number,
    lastWatched: String
  }],
  readNotifications: [String],
  preferences: {
    audio: { type: String, enum: ['tr', 'en'] },
    subtitle: { type: String, enum: ['off', 'tr', 'en'] },
    subColor: String,
    subSize: String
  }
});

export const Profile = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);

// Active Session Schema
const ActiveSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  profileId: { type: String, required: true, index: true },
  ipAddress: { type: String, required: true },
  lastActive: { type: String, required: true, index: true }, // frequently queried for cleanup
  watchingType: { type: String, enum: ['movie', 'series'] },
  watchingId: String
});

export const ActiveSession = mongoose.models.ActiveSession || mongoose.model('ActiveSession', ActiveSessionSchema);

// Cast Member Sub-Schema
const CastMemberSchema = new mongoose.Schema({
  name: String,
  photoUrl: String,
  role: String
}, { _id: false });

// Movie Schema
const MovieSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, index: true }, // Indexed for search
  type: { type: String, default: 'movie' },
  story: { type: String },
  bannerUrl: { type: String },
  videoUrl: { type: String, required: true },
  videoUrlEN: String,
  subtitleTR: String,
  subtitleEN: String,
  categories: [{ type: String, index: true }], // Indexed for filtering
  year: Number,
  imdbRating: Number,
  director: String,
  cast: [CastMemberSchema],
  isM3U: { type: Boolean, default: false }
});

export const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);

// Series Schema
const SeriesSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, index: true }, // Indexed for search
  story: { type: String },
  bannerUrl: { type: String },
  categories: [{ type: String, index: true }], // Indexed for filtering
  year: Number,
  imdbRating: Number,
  director: String,
  cast: [CastMemberSchema],
  isM3U: { type: Boolean, default: false }
});

export const Series = mongoose.models.Series || mongoose.model('Series', SeriesSchema);

// Episode Schema
const EpisodeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  seriesId: { type: String, required: true, index: true }, // Indexed for fetching by series
  seasonNumber: { type: Number, required: true },
  episodeNumber: { type: Number, required: true },
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  videoUrlEN: String,
  subtitleTR: String,
  subtitleEN: String,
  story: String,
  bannerUrl: String
});

export const Episode = mongoose.models.Episode || mongoose.model('Episode', EpisodeSchema);

// Notification Schema
const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: String, required: true },
  targetPackage: { type: String, enum: ['All', 'Iron', 'Gold', 'Diamond'], default: 'All', index: true },
  link: String
});

export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// Comment Schema
const CommentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  mediaId: { type: String, required: true, index: true }, // Indexed for fetching by media
  profileId: { type: String, required: true },
  profileName: { type: String, required: true },
  profileAvatar: { type: String, required: true },
  content: { type: String, required: true },
  rating: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true }, // Indexed for filtering approved comments
  createdAt: { type: String, required: true }
});

export const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

// Config Schema (Singleton for maintenance, dailyGoldSeries, bsplusTv)
const ConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // 'mainConfig'
  maintenance: { type: Boolean, default: false },
  dailyGoldSeries: {
    date: String,
    seriesIds: [String]
  },
  bsplusTv: {
    streamUrl: String,
    currentProgram: String
  }
});

export const Config = mongoose.models.Config || mongoose.model('Config', ConfigSchema);

// Live Playlist Schema
const LivePlaylistSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  url: { type: String, required: true }
});

export const LivePlaylist = mongoose.models.LivePlaylist || mongoose.model('LivePlaylist', LivePlaylistSchema);

// Sports Channel Schema
const SportsChannelSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  logoUrl: { type: String, required: true },
  streamUrl: { type: String, required: true }
});

export const SportsChannel = mongoose.models.SportsChannel || mongoose.model('SportsChannel', SportsChannelSchema);

// TV Schedule Schema
const TvScheduleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  dayOfWeek: { type: Number, required: true, index: true }, // 0 (Sunday) to 6 (Saturday)
  startTime: { type: String, required: true }, // "HH:MM" e.g. "14:00"
  endTime: { type: String, required: true }, // "HH:MM" e.g. "16:00"
  title: { type: String, required: true },
  streamUrl: { type: String, required: true }
});

export const TvSchedule = mongoose.models.TvSchedule || mongoose.model('TvSchedule', TvScheduleSchema);
