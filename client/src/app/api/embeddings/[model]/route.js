/**
 * API Route: Get CLIP embeddings for client-side use
 * Serves embeddings from the database to the client for local search
 */

import { NextRequest, NextResponse } from 'next/server';

const UNIFIED_SERVER_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request, { params }) {
  const { model } = await params;
  
  try {
    // Validate model parameter
    const validModels = ['clip', 'eva02', 'dfn5b'];
    if (!validModels.includes(model.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid model. Supported: ${validModels.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch embeddings from the server
    const response = await fetch(`${UNIFIED_SERVER_URL}/embeddings/${model.toLowerCase()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache headers for better performance
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch embeddings: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return embeddings with metadata
    return NextResponse.json({
      model: model.toUpperCase(),
      embeddings: data.embeddings || {},
      count: Object.keys(data.embeddings || {}).length,
      timestamp: Date.now(),
      source: 'database'
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error(`Error fetching ${model} embeddings:`, error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
