import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('get_dashboard_stats');

    if (error) {
      console.error('Error calling rpc get_dashboard_stats:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Unexpected error in /api/stats:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}