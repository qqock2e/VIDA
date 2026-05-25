import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/leaderboard — Submit a new score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nickname, points, round, difficulty } = body

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nickname is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (typeof points !== 'number' || !Number.isInteger(points)) {
      return NextResponse.json(
        { error: 'Points must be an integer' },
        { status: 400 }
      )
    }

    if (typeof round !== 'number' || !Number.isInteger(round)) {
      return NextResponse.json(
        { error: 'Round must be an integer' },
        { status: 400 }
      )
    }

    if (!difficulty || typeof difficulty !== 'string' || difficulty.trim().length === 0) {
      return NextResponse.json(
        { error: 'Difficulty is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const entry = await db.leaderboardEntry.create({
      data: {
        nickname: nickname.trim(),
        points,
        round,
        difficulty: difficulty.trim(),
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating leaderboard entry:', error)
    return NextResponse.json(
      { error: 'Failed to create leaderboard entry' },
      { status: 500 }
    )
  }
}

// GET /api/leaderboard — Get top entries sorted by round desc (then points desc)
// ?difficulty=easy  — filter by difficulty
// Without filter: returns up to 30 entries (for grouping by difficulty on frontend)
// With filter: returns top 10 for that difficulty
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const difficulty = searchParams.get('difficulty')

    const where = difficulty ? { difficulty } : {}

    // Sort by round DESC first (primary), then points DESC (tiebreaker)
    const take = difficulty ? 10 : 30

    const entries = await db.leaderboardEntry.findMany({
      where,
      orderBy: [{ round: 'desc' }, { points: 'desc' }],
      take,
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
