import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongoose';
import { User, Movie, Series, Episode, Comment, Notification, Config, SportsChannel, Coupon, TvSchedule } from '@/lib/models';
import { PackageType } from '@/lib/types';

function generateRandomString(length: number) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    if (adminToken !== 'b.batin123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, payload } = await req.json();
    await connectDB();

    if (action === 'addMovie') {
      await Movie.create({
        id: crypto.randomUUID(),
        ...payload,
        year: payload.year ? Number(payload.year) : undefined,
        imdbRating: payload.imdbRating ? Number(payload.imdbRating) : undefined,
        cast: payload.cast ? (typeof payload.cast === 'string' ? JSON.parse(payload.cast) : payload.cast) : undefined,
        categories: payload.categories ? (typeof payload.categories === 'string' ? JSON.parse(payload.categories) : payload.categories) : undefined,
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'editMovie') {
      const updated = await Movie.findOneAndUpdate({ id: payload.id }, {
        ...payload,
        year: payload.year ? Number(payload.year) : undefined,
        imdbRating: payload.imdbRating ? Number(payload.imdbRating) : undefined,
        cast: payload.cast ? (typeof payload.cast === 'string' ? JSON.parse(payload.cast) : payload.cast) : undefined,
        categories: payload.categories ? (typeof payload.categories === 'string' ? JSON.parse(payload.categories) : payload.categories) : undefined,
      });
      if (updated) return NextResponse.json({ success: true });
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    if (action === 'deleteMovie') {
      await Movie.findOneAndDelete({ id: payload.id });
      return NextResponse.json({ success: true });
    }

    if (action === 'addSeries') {
      await Series.create({
        id: crypto.randomUUID(),
        ...payload,
        year: payload.year ? Number(payload.year) : undefined,
        imdbRating: payload.imdbRating ? Number(payload.imdbRating) : undefined,
        cast: payload.cast ? (typeof payload.cast === 'string' ? JSON.parse(payload.cast) : payload.cast) : undefined,
        categories: payload.categories ? (typeof payload.categories === 'string' ? JSON.parse(payload.categories) : payload.categories) : undefined,
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'editSeries') {
      const updated = await Series.findOneAndUpdate({ id: payload.id }, {
        ...payload,
        year: payload.year ? Number(payload.year) : undefined,
        imdbRating: payload.imdbRating ? Number(payload.imdbRating) : undefined,
        cast: payload.cast ? (typeof payload.cast === 'string' ? JSON.parse(payload.cast) : payload.cast) : undefined,
        categories: payload.categories ? (typeof payload.categories === 'string' ? JSON.parse(payload.categories) : payload.categories) : undefined,
      });
      if (updated) return NextResponse.json({ success: true });
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    if (action === 'deleteSeries') {
      await Series.findOneAndDelete({ id: payload.id });
      await Episode.deleteMany({ seriesId: payload.id });
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteEpisode') {
      await Episode.findOneAndDelete({ id: payload.id });
      return NextResponse.json({ success: true });
    }

    if (action === 'bulkDeleteM3U') {
      await Movie.deleteMany({ isM3U: true });
      const seriesToDelete = await Series.find({ isM3U: true }).select('id').lean();
      const sIds = seriesToDelete.map((s: any) => s.id);
      await Series.deleteMany({ isM3U: true });
      if (sIds.length > 0) {
        await Episode.deleteMany({ seriesId: { $in: sIds } });
      }
      return NextResponse.json({ success: true, message: 'Tüm M3U içerikleri silindi.' });
    }

    if (action === 'addEpisode') {
      await Episode.create({
        id: crypto.randomUUID(),
        seriesId: payload.seriesId,
        seasonNumber: parseInt(payload.seasonNumber),
        episodeNumber: parseInt(payload.episodeNumber),
        title: payload.title,
        videoUrl: payload.videoUrl,
        videoUrlEN: payload.videoUrlEN || undefined,
        subtitleTR: payload.subtitleTR || undefined,
        subtitleEN: payload.subtitleEN || undefined,
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'updateBsPlusTv') {
      await Config.findOneAndUpdate(
        { key: 'mainConfig' },
        { 
          $set: { 
            bsplusTv: { streamUrl: payload.streamUrl, currentProgram: payload.currentProgram } 
          }
        },
        { upsert: true }
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteBulkM3uSeries') {
      await Series.deleteMany({ story: 'M3U ile toplu eklendi.' });
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteBulkM3uMovies') {
      await Movie.deleteMany({ story: 'M3U ile toplu eklendi.' });
      return NextResponse.json({ success: true });
    }

    if (action === 'addSportsChannel') {
      await SportsChannel.create({
        id: crypto.randomUUID(),
        name: payload.name,
        logoUrl: payload.logoUrl,
        streamUrl: payload.streamUrl
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'editSportsChannel') {
      const updated = await SportsChannel.findOneAndUpdate({ id: payload.id }, {
        name: payload.name,
        logoUrl: payload.logoUrl,
        streamUrl: payload.streamUrl
      });
      if (updated) return NextResponse.json({ success: true });
      return NextResponse.json({ error: 'Spor kanalı bulunamadı' }, { status: 404 });
    }

    if (action === 'deleteSportsChannel') {
      await SportsChannel.findOneAndDelete({ id: payload.id });
      return NextResponse.json({ success: true });
    }

    if (action === 'createUser') {
      const username = `user_${generateRandomString(6)}`;
      const password = generateRandomString(10);
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        id: crypto.randomUUID(),
        username,
        passwordHash,
        twoFactorEnabled: false,
        package: payload.package as PackageType,
        isBanned: false,
        plainPassword: password,
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({ success: true, user: { username, password, package: newUser.package } });
    }

    if (action === 'banUser') {
      const user = await User.findOne({ username: payload.username });
      if (user) {
        user.isBanned = !user.isBanned;
        await user.save();
        return NextResponse.json({ success: true, isBanned: user.isBanned });
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'deleteUser') {
      const result = await User.findOneAndDelete({ username: payload.username });
      if (result) return NextResponse.json({ success: true });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'backupDatabase') {
      const users = await User.find().lean();
      const movies = await Movie.find().lean();
      const series = await Series.find().lean();
      const episodes = await Episode.find().lean();
      const config = await Config.findOne({ key: 'mainConfig' }).lean();
      
      const dbObj = { users, movies, series, episodes, ...config };
      
      return new NextResponse(JSON.stringify(dbObj, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="bsplus-backup-${new Date().toISOString().slice(0, 10)}.json"`
        }
      });
    }

    if (action === 'toggleMaintenance') {
      const conf = await Config.findOne({ key: 'mainConfig' });
      if (conf) {
        conf.maintenance = !conf.maintenance;
        await conf.save();
        return NextResponse.json({ success: true, maintenance: conf.maintenance });
      } else {
        await Config.create({ key: 'mainConfig', maintenance: true });
        return NextResponse.json({ success: true, maintenance: true });
      }
    }

    if (action === 'approveComment') {
      const comment = await Comment.findOne({ id: payload.id });
      if (comment) {
        comment.status = 'approved';
        await comment.save();
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (action === 'deleteComment') {
      await Comment.findOneAndDelete({ id: payload.id });
      return NextResponse.json({ success: true });
    }

    if (action === 'sendNotification') {
      await Notification.create({
        id: crypto.randomUUID(),
        title: payload.title,
        message: payload.message,
        targetPackage: payload.targetPackage || 'All',
        link: payload.link || undefined,
        createdAt: new Date().toISOString()
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteNotification') {
      await Notification.findOneAndDelete({ id: payload.id });
      return NextResponse.json({ success: true });
    }

    if (action === 'addTvSchedule') {
      await TvSchedule.create({ id: crypto.randomUUID(), ...payload });
      return NextResponse.json({ success: true });
    }

    if (action === 'editTvSchedule') {
      const updated = await TvSchedule.findOneAndUpdate({ id: payload.id }, payload);
      if (updated) return NextResponse.json({ success: true });
      return NextResponse.json({ error: 'TvSchedule not found' }, { status: 404 });
    }

    if (action === 'deleteTvSchedule') {
      await TvSchedule.findOneAndDelete({ id: payload.id });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    if (adminToken !== 'b.batin123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    const [users, movies, series, episodes, comments, notifications, config, sportsChannels, coupons, tvSchedules] = await Promise.all([
      User.find().lean(),
      Movie.find().lean(),
      Series.find().lean(),
      Episode.find().lean(),
      Comment.find().lean(),
      Notification.find().lean(),
      Config.findOne({ key: 'mainConfig' }).lean(),
      SportsChannel.find().lean(),
      Coupon.find().lean(),
      TvSchedule.find().lean()
    ]);

    const safeUsers = users.map((u: any) => ({ 
      id: u.id, 
      username: u.username, 
      package: u.package, 
      isBanned: u.isBanned, 
      createdAt: u.createdAt, 
      plainPassword: u.plainPassword,
      isTrial: u.isTrial,
      trialExpiresAt: u.trialExpiresAt
    }));
    
    return NextResponse.json({ 
      users: safeUsers, 
      movies, 
      series, 
      episodes, 
      bsplusTv: (config as any)?.bsplusTv || { streamUrl: '', currentProgram: 'Şu an yayında içerik bulunmuyor.' },
      comments,
      maintenance: (config as any)?.maintenance || false,
      notifications,
      sportsChannels,
      coupons,
      tvSchedules
    });
  } catch (err: any) {
    console.error('Admin API GET Error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
