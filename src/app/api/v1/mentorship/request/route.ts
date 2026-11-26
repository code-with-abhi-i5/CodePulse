import { NextRequest, NextResponse } from 'next/server';

interface StoredMentorshipRequest {
  id: string;
  mentorUsername: string;
  mentorId?: string;
  projectGoals: string;
  expectedHours: number;
  message: string;
  menteeUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

const requestsStore: StoredMentorshipRequest[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mentorId, mentorUsername, projectGoals, expectedHours, message, menteeUsername } = body;

    if (!projectGoals || !projectGoals.trim()) {
      return NextResponse.json(
        { success: false, message: 'Project goals are required.' },
        { status: 400 }
      );
    }

    if (!expectedHours || Number(expectedHours) <= 0) {
      return NextResponse.json(
        { success: false, message: 'Expected hours must be greater than 0.' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: 'Message to the mentor is required.' },
        { status: 400 }
      );
    }

    const newRequest: StoredMentorshipRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      mentorId: mentorId || '',
      mentorUsername: mentorUsername || 'mentor',
      projectGoals: projectGoals.trim(),
      expectedHours: Number(expectedHours),
      message: message.trim(),
      menteeUsername: menteeUsername || 'anonymous_dev',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    requestsStore.push(newRequest);

    return NextResponse.json(
      {
        success: true,
        message: 'Mentorship request submitted successfully!',
        data: newRequest,
      },
      { status: 201 }
    );
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

export async function GET() {
  return NextResponse.json({
    success: true,
    data: requestsStore,
  });
}
