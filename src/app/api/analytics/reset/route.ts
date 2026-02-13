import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createServerClient();

    // Sessions has CASCADE delete, so deleting sessions removes all related data
    const { error } = await supabase
      .from('sessions')
      .delete()
      .gte('started_at', '1970-01-01');

    if (error) {
      console.error('Reset error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'All analytics data has been reset' });
  } catch (error) {
    console.error('Reset API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset analytics data' },
      { status: 500 }
    );
  }
}
