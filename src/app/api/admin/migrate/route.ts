import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { User, Profile, ActiveSession, Movie, Series, Episode, Notification, Comment, Config } from '@/lib/models';
import { readDB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    await connectDB();
    const oldDb = await readDB(); // Reading from local database.json (or VDS)

    // Clear old collections
    await User.deleteMany({});
    await Profile.deleteMany({});
    await ActiveSession.deleteMany({});
    await Movie.deleteMany({});
    await Series.deleteMany({});
    await Episode.deleteMany({});
    await Notification.deleteMany({});
    await Comment.deleteMany({});
    await Config.deleteMany({});

    // Migrate Users
    if (oldDb.users?.length) await User.insertMany(oldDb.users);
    
    // Migrate Profiles
    if (oldDb.profiles?.length) await Profile.insertMany(oldDb.profiles);
    
    // Migrate ActiveSessions
    if (oldDb.activeSessions?.length) await ActiveSession.insertMany(oldDb.activeSessions);

    // Migrate Movies
    if (oldDb.movies?.length) await Movie.insertMany(oldDb.movies);

    // Migrate Series
    if (oldDb.series?.length) await Series.insertMany(oldDb.series);

    // Migrate Episodes
    if (oldDb.episodes?.length) await Episode.insertMany(oldDb.episodes);

    // Migrate Notifications
    if (oldDb.notifications?.length) await Notification.insertMany(oldDb.notifications);

    // Migrate Comments
    if (oldDb.comments?.length) await Comment.insertMany(oldDb.comments);

    // Migrate Config
    await Config.create({
      key: 'mainConfig',
      maintenance: oldDb.maintenance || false,
      dailyGoldSeries: oldDb.dailyGoldSeries || { date: '', seriesIds: [] },
      bsplusTv: (oldDb as any).bsplusTv || { streamUrl: '', currentProgram: 'Şu an yayında içerik bulunmuyor.' }
    });

    return NextResponse.json({ success: true, message: 'Veritabanı başarıyla MongoDB ye kopyalandı!' });
  } catch (err: any) {
    console.error('Migration Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
