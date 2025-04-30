import { NextResponse } from 'next/server';
import { runPythonModel } from '@/lib/python-bridge';

export async function POST() {
  try {
    const predictions = await runPythonModel();
    return NextResponse.json(predictions);
  } catch (error) {
    console.error('Error running model:', error);
    return NextResponse.json(
      { error: 'Failed to get predictions' },
      { status: 500 }
    );
  }
} 