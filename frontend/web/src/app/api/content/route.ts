import { NextResponse } from 'next/server';
import { getStaticContent, updateStaticContent } from '@/lib/content';

export async function GET() {
  return NextResponse.json({ statusCode: 200, data: getStaticContent() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { section, data } = body;
    
    if (!section || !data) {
      return NextResponse.json({ statusCode: 400, message: "Missing section or data" }, { status: 400 });
    }

    const success = updateStaticContent(section, data);
    
    if (success) {
      return NextResponse.json({ statusCode: 200, message: "Updated successfully" });
    }
    return NextResponse.json({ statusCode: 500, message: "Failed to update" }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ statusCode: 500, message: "Server error" }, { status: 500 });
  }
}
