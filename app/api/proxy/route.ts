import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, apiKey, endpoint, method = 'GET', data } = body;

    if (!url || !apiKey || !endpoint) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const targetUrl = `${url.replace(/\/$/, '')}${endpoint}`;
    
    const headers: HeadersInit = {
      'X-Redmine-API-Key': apiKey,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(targetUrl, options);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Redmine API Error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Handle 204 No Content (common for PUT/DELETE)
    if (response.status === 204) {
        return new NextResponse(null, { status: 204 });
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
