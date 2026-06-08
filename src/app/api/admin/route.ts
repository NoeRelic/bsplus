import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
    const db = await readDB();

    if (action === 'addMovie') {
      db.movies.push({
        id: crypto.randomUUID(),
        ...payload,
        year: payload.year ? Number(payload.year) : undefined,
        imdbRating: payload.imdbRating ? Number(payload.imdbRating) : undefined,
        cast: payload.cast ? (typeof payload.cast === 'string' ? JSON.parse(payload.cast) : payload.cast) : undefined,
        categories: payload.categories ? (typeof payload.categories === 'string' ? JSON.parse(payload.categories) : payload.categories) : undefined,
      });
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'editMovie') {
      const idx = db.movies.findIndex(m => m.id === payload.id);
      if (idx > -1) {
        db.movies[idx] = { 
          ...db.movies[idx], 
          ...payload,
          year: payload.year ? Number(payload.year) : undefined,
          imdbRating: payload.imdbRating ? Number(payload.imdbRating) : undefined,
          cast: payload.cast ? (typeof payload.cast === 'string' ? JSON.parse(payload.cast) : payload.cast) : undefined,
          categories: payload.categories ? (typeof payload.categories === 'string' ? JSON.parse(payload.categories) : payload.categories) : undefined,
        };
        await writeDB(db);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    if (action === 'deleteMovie') {
      db.movies = db.movies.filter(m => m.id !== payload.id);
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'addSeries') {
      db.series.push({
        id: crypto.randomUUID(),
        ...payload,
        year: payload.year ? Number(payload.year) : undefined,
        imdbRating: payload.imdbRating ? Number(payload.imdbRating) : undefined,
        cast: payload.cast ? (typeof payload.cast === 'string' ? JSON.parse(payload.cast) : payload.cast) : undefined,
        categories: payload.categories ? (typeof payload.categories === 'string' ? JSON.parse(payload.categories) : payload.categories) : undefined,
      });
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'editSeries') {
      const idx = db.series.findIndex(s => s.id === payload.id);
      if (idx > -1) {
        db.series[idx] = { 
          ...db.series[idx], 
          ...payload,
          year: payload.year ? Number(payload.year) : undefined,
          imdbRating: payload.imdbRating ? Number(payload.imdbRating) : undefined,
          cast: payload.cast ? (typeof payload.cast === 'string' ? JSON.parse(payload.cast) : payload.cast) : undefined,
          categories: payload.categories ? (typeof payload.categories === 'string' ? JSON.parse(payload.categories) : payload.categories) : undefined,
        };
        await writeDB(db);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    if (action === 'deleteSeries') {
      db.series = db.series.filter(s => s.id !== payload.id);
      // Optional: Delete associated episodes too
      db.episodes = db.episodes.filter(e => e.seriesId !== payload.id);
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteEpisode') {
      db.episodes = db.episodes.filter(e => e.id !== payload.id);
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'bulkDeleteM3U') {
      // Delete movies and series that were imported via M3U
      db.movies = (db.movies || []).filter(m => !(m as any).isM3U);
      const seriesToDelete = (db.series || []).filter(s => (s as any).isM3U).map(s => s.id);
      db.series = (db.series || []).filter(s => !(s as any).isM3U);
      db.episodes = (db.episodes || []).filter(e => !seriesToDelete.includes(e.seriesId));
      await writeDB(db);
      return NextResponse.json({ success: true, message: 'Tüm M3U içerikleri silindi.' });
    }

    if (action === 'addEpisode') {
      db.episodes.push({
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
      await writeDB(db);
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'addChannel') {
      if (!db.channels) db.channels = [];
      db.channels.push({
        id: crypto.randomUUID(),
        name: payload.name,
        logoUrl: payload.logoUrl,
        streamUrl: payload.streamUrl,
      });
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteChannel') {
      if (!db.channels) db.channels = [];
      db.channels = db.channels.filter(c => c.id !== payload.id);
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'addLivePlaylist') {
      if (!db.livePlaylists) db.livePlaylists = [];
      db.livePlaylists.push({
        id: crypto.randomUUID(),
        name: payload.name || 'İsimsiz Playlist',
        url: payload.url,
      });
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteLivePlaylist') {
      if (!db.livePlaylists) db.livePlaylists = [];
      db.livePlaylists = db.livePlaylists.filter(p => p.id !== payload.id);
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'createUser') {
      const username = `user_${generateRandomString(6)}`;
      const password = generateRandomString(10);
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = {
        id: crypto.randomUUID(),
        username,
        passwordHash,
        twoFactorEnabled: false,
        package: payload.package as PackageType,
        isBanned: false,
        plainPassword: password,
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);
      await writeDB(db);

      return NextResponse.json({ success: true, user: { username, password, package: newUser.package } });
    }

    if (action === 'banUser') {
      const userIndex = db.users.findIndex(u => u.username === payload.username);
      if (userIndex > -1) {
        db.users[userIndex].isBanned = !db.users[userIndex].isBanned;
        await writeDB(db);
        return NextResponse.json({ success: true, isBanned: db.users[userIndex].isBanned });
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'deleteUser') {
      const initialLength = db.users.length;
      db.users = db.users.filter(u => u.username !== payload.username);
      if (db.users.length !== initialLength) {
        await writeDB(db);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'backupDatabase') {
      return new NextResponse(JSON.stringify(db, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="bsplus-backup-${new Date().toISOString().slice(0, 10)}.json"`
        }
      });
    }

    if (action === 'toggleMaintenance') {
      db.maintenance = !db.maintenance;
      await writeDB(db);
      return NextResponse.json({ success: true, maintenance: db.maintenance });
    }

    if (action === 'approveComment') {
      if (!db.comments) return NextResponse.json({ error: 'No comments' }, { status: 404 });
      const idx = db.comments.findIndex(c => c.id === payload.id);
      if (idx > -1) {
        db.comments[idx].status = 'approved';
        await writeDB(db);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (action === 'deleteComment') {
      if (!db.comments) return NextResponse.json({ error: 'No comments' }, { status: 404 });
      db.comments = db.comments.filter(c => c.id !== payload.id);
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'sendNotification') {
      if (!db.notifications) db.notifications = [];
      db.notifications.push({
        id: crypto.randomUUID(),
        title: payload.title,
        message: payload.message,
        targetPackage: payload.targetPackage || 'All',
        link: payload.link || undefined,
        createdAt: new Date().toISOString()
      });
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteNotification') {
      if (!db.notifications) return NextResponse.json({ error: 'No notifications' }, { status: 404 });
      db.notifications = db.notifications.filter(n => n.id !== payload.id);
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
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
    const db = await readDB();
    // Return safe data for admin dashboard
    const users = db.users.map(u => ({ id: u.id, username: u.username, package: u.package, isBanned: u.isBanned, createdAt: u.createdAt, plainPassword: u.plainPassword }));
    return NextResponse.json({ 
      users, 
      movies: db.movies, 
      series: db.series, 
      episodes: db.episodes, 
      channels: db.channels || [], 
      livePlaylists: db.livePlaylists || [],
      comments: db.comments || [],
      maintenance: db.maintenance || false,
      notifications: db.notifications || []
    });
  } catch (err: any) {
    console.error('Admin API GET Error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
