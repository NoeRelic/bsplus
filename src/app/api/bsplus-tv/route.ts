import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Config, TvSchedule } from '@/lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const config = await Config.findOne({ key: 'mainConfig' }).lean();
    let bsplusTv = config?.bsplusTv || { streamUrl: '', currentProgram: 'Şu an yayında içerik bulunmuyor.' };
    
    // Turkish time adjustment
    const now = new Date();
    const trTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
    const currentDay = trTime.getDay(); // 0-6
    const currentHour = trTime.getHours().toString().padStart(2, '0');
    const currentMin = trTime.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMin}`;

    const todaySchedules = await TvSchedule.find({ dayOfWeek: currentDay }).lean() as any[];

    // Sort schedules by startTime
    todaySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Find the currently active schedule
    const activeSchedule = todaySchedules.find(s => {
      return currentTimeStr >= s.startTime && currentTimeStr < s.endTime;
    });

    if (activeSchedule) {
      bsplusTv = {
        streamUrl: activeSchedule.streamUrl,
        currentProgram: activeSchedule.title
      };
    }
    
    return NextResponse.json({ bsplusTv, todaySchedules });
  } catch (err: any) {
    console.error('BS+ TV API Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

