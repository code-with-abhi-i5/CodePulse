import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { isMentor, availableSlots = 3 } = body;

    return NextResponse.json({
      success: true,
      isMentor: Boolean(isMentor),
      availableSlots: Number(availableSlots),
      message: isMentor
        ? `Mentorship slots opened! You have ${availableSlots} available slot${availableSlots > 1 ? 's' : ''}.`
        : 'Mentorship slots closed.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Invalid payload',
      },
      { status: 400 }
    );
  }
}
