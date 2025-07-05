import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const engine = searchParams.get('engine') || 'walmart';
  const num = searchParams.get('num') || '40';
  const page = searchParams.get('page') || '1';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const serpApiKey = process.env.NEXT_PUBLIC_SERP_API_KEY || '6bcbe76b8b514518985e3007d17211f273c1691b24ad3ea72596b847e258b230';
    
    const params = new URLSearchParams({
      api_key: serpApiKey,
      engine: engine,
      query: query,
      ps: num,
      page: page,
      sort: 'best_match',
      device: 'desktop'
    });

    const response = await fetch(`https://serpapi.com/search.json?${params}`);
    
    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('SerpAPI request failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' }, 
      { status: 500 }
    );
  }
} 