import { NextResponse } from 'next/server'

// Try both env var formats
const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY || process.env.OMDB_API_KEY || '9c942de4';
const BASE_URL = 'https://www.omdbapi.com/';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ Search: [] });
  }

  try {
    // OMDb API format: ?s=query&apikey=key (no 'type' parameter in basic search)
    const url = `${BASE_URL}?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`;
    console.log('OMDb API URL:', url.replace(OMDB_API_KEY, '***'));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('OMDb API HTTP Error:', response.status, response.statusText);
      return NextResponse.json({ Search: [], Error: `HTTP ${response.status}: ${response.statusText}` });
    }
    
    const data = await response.json();
    console.log('OMDb API Response:', JSON.stringify(data, null, 2));
    
    if (data.Response === 'False' || !data.Search) {
      console.error('OMDb API Error:', data.Error);
      return NextResponse.json({ Search: [], Error: data.Error || 'No results found' });
    }
    
    // Filter to only movies and series
    const filteredResults = data.Search.filter((item: any) => 
      item.Type === 'movie' || item.Type === 'series'
    );
    
    return NextResponse.json({ Search: filteredResults });
  } catch (error) {
    console.error(`Failed to search movies for query "${query}":`, error);
    return NextResponse.json({ Search: [], Error: 'Failed to fetch results' });
  }
}

