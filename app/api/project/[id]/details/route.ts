
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache
// Key: projectId, Value: { data: any, timestamp: number }
const projectCache = new Map<number, { data: any, timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseInt(id);

  try {
    const body = await request.json();
    const { url, apiKey } = body;

    if (!url || !apiKey) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Check cache
    const cached = projectCache.get(projectId);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        console.log(`Returning cached details for project ${projectId}`);
        return NextResponse.json(cached.data);
    }

    const baseUrl = url.replace(/\/$/, '');
    const headers = {
      'X-Redmine-API-Key': apiKey,
      'Content-Type': 'application/json',
    };

    // Helper to fetch from Redmine
    const fetchRedmine = async (endpoint: string) => {
      const res = await fetch(`${baseUrl}${endpoint}`, { headers });
      if (!res.ok) throw new Error(`Redmine API error: ${res.status}`);
      return res.json();
    };

    // 1. Fetch Project Details (Trackers)
    let trackers = [];
    try {
      const projectData = await fetchRedmine(`/projects/${projectId}.json?include=trackers`);
      trackers = projectData.project.trackers || [];
    } catch (error) {
      console.error('Failed to fetch trackers:', error);
    }

    // 2. Fetch Memberships (Users)
    let users: any[] = [];
    try {
      // Try fetching all at once first
      const membershipsData = await fetchRedmine(`/projects/${projectId}/memberships.json?limit=100`);
      users = membershipsData.memberships.map((m: any) => m.user).filter((u: any) => u);
    } catch (error) {
      console.warn('Failed to fetch memberships in bulk (likely 500 error). Trying chunked fetch...');
      
      const CHUNK_SIZE = 10;
      const MAX_MEMBERS_TO_FETCH = 100; // Cap to avoid timeout (increased to 100 to catch more users)
      
      for (let offset = 0; offset < MAX_MEMBERS_TO_FETCH; offset += CHUNK_SIZE) {
          try {
              const chunkData = await fetchRedmine(`/projects/${projectId}/memberships.json?limit=${CHUNK_SIZE}&offset=${offset}`);
              const chunkUsers = chunkData.memberships.map((m: any) => m.user).filter((u: any) => u);
              if (chunkUsers.length === 0) break;
              users = [...users, ...chunkUsers];
          } catch (e) {
              console.error(`Failed to fetch membership chunk at offset ${offset}. Trying individual fetch...`);
              // If a chunk fails, try to fetch items one by one in this range
              for (let i = 0; i < CHUNK_SIZE; i++) {
                  try {
                      const singleData = await fetchRedmine(`/projects/${projectId}/memberships.json?limit=1&offset=${offset + i}`);
                      if (singleData.memberships && singleData.memberships.length > 0) {
                          const m = singleData.memberships[0];
                          if (m.user) users.push(m.user);
                      }
                  } catch (innerError) {
                      // console.log(`Failed to fetch individual membership at offset ${offset + i}`);
                  }
              }
          }
      }
    }

    // 3. Verify Users (Filter out retired/locked)
    // We do this in parallel with a concurrency limit
    const validUsers: any[] = [];
    const CONCURRENCY_LIMIT = 5;
    
    // Deduplicate users just in case
    const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());

    for (let i = 0; i < uniqueUsers.length; i += CONCURRENCY_LIMIT) {
        const chunk = uniqueUsers.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(chunk.map(async (user: any) => {
            try {
                await fetchRedmine(`/users/${user.id}.json`);
                validUsers.push(user);
            } catch (e) {
                // User is invalid/locked
            }
        }));
    }

    const responseData = {
      trackers,
      users: validUsers
    };

    // Update cache
    projectCache.set(projectId, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Error in project details route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
