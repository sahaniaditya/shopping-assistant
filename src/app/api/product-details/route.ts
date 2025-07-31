import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');

  if (!productId) {
    return NextResponse.json({ error: 'Product ID parameter is required' }, { status: 400 });
  }

  try {
    const serpApiKey = process.env.NEXT_PUBLIC_SERP_API_KEY;
    
    const params = new URLSearchParams({
      api_key: serpApiKey,
      engine: 'walmart_product',
      product_id: productId,
      device: 'desktop'
    });

    const response = await fetch(`https://serpapi.com/search.json?${params}`);
    
    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('SerpAPI product details request failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product details' }, 
      { status: 500 }
    );
  }
} 