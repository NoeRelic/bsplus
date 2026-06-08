import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Dosya yüklenmedi.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'subtitles');
    await mkdir(uploadDir, { recursive: true });

    // Sanitize filename and make unique
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
    const path = join(uploadDir, uniqueName);

    await writeFile(path, buffer);

    return NextResponse.json({ success: true, url: `/uploads/subtitles/${uniqueName}` });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Yükleme başarısız oldu.' }, { status: 500 });
  }
}
