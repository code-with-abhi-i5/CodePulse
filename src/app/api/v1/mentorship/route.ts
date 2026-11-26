import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_MENTORS, Mentor } from '@/services/mentorship';

// In-memory mentors store for runtime session modifications
let mentorsStore: Mentor[] = [...INITIAL_MENTORS];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const language = searchParams.get('language')?.toLowerCase() || '';

    let mentors = [...mentorsStore];

    if (search) {
      mentors = mentors.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.username.toLowerCase().includes(search) ||
          m.bio.toLowerCase().includes(search) ||
          m.matchingTech.some((t) => t.toLowerCase().includes(search))
      );
    }

    if (language && language !== 'all') {
      mentors = mentors.filter(
        (m) =>
          m.topLanguages.some((l) => l.name.toLowerCase() === language) ||
          m.matchingTech.some((t) => t.toLowerCase() === language)
      );
    }

    return NextResponse.json({
      success: true,
      data: mentors,
      meta: {
        total: mentors.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { isMentor, availableSlots = 3, username = 'currentUser' } = body;

    const existingIndex = mentorsStore.findIndex((m) => m.username === username);
    if (existingIndex >= 0) {
      mentorsStore[existingIndex] = {
        ...mentorsStore[existingIndex],
        isMentor: Boolean(isMentor),
        availableSlots: Number(availableSlots),
      };
    } else if (isMentor) {
      mentorsStore.unshift({
        id: `m-${Date.now()}`,
        username,
        name: body.name || 'Current User',
        role: body.role || 'Senior Full-Stack Developer',
        avatarUrl: body.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        bio: body.bio || 'Experienced developer excited to mentor upcoming engineers.',
        similarityScore: 94,
        topLanguages: [
          { name: 'TypeScript', level: 'Master', mastery: 95, color: '#3178c6' },
          { name: 'React', level: 'Expert', mastery: 92, color: '#61dafb' },
          { name: 'Python', level: 'Advanced', mastery: 85, color: '#3572a5' },
        ],
        matchingTech: ['TypeScript', 'React', 'Node.js'],
        timezoneOffset: 'UTC+0',
        experienceGap: 5,
        isAvailableNow: true,
        rating: 5.0,
        sessionsCompleted: 0,
        availableSlots: Number(availableSlots),
        isMentor: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Mentor status updated successfully',
      data: {
        isMentor: Boolean(isMentor),
        availableSlots: Number(availableSlots),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Invalid request payload',
      },
      { status: 400 }
    );
  }
}
