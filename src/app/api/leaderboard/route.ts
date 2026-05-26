import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/leaderboard — Submit a new score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nickname, points, round, difficulty, mode, life } = body

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

    // Validate mode — must be "normal" or "infinity", defaults to "normal"
    const entryMode = mode ?? 'normal'
    if (entryMode !== 'normal' && entryMode !== 'infinity') {
      return NextResponse.json(
        { error: 'Mode must be "normal" or "infinity"' },
        { status: 400 }
      )
    }

    // Validate life — must be a number, defaults to 0
    const entryLife = life ?? 0
    if (typeof entryLife !== 'number') {
      return NextResponse.json(
        { error: 'Life must be a number' },
        { status: 400 }
      )
    }

    const entry = await db.leaderboardEntry.create({
      data: {
        nickname: nickname.trim(),
        points,
        round,
        difficulty: difficulty.trim(),
        mode: entryMode,
        life: entryLife,
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

// GET /api/leaderboard — Get top entries
// ?difficulty=easy        — filter by difficulty
// ?mode=normal            — filter by mode ("normal" or "infinity")
// ?difficulty=easy&mode=normal — filter by both, top 10
// Sorting: round DESC, then life DESC
// No filters: group by difficulty, up to 10 per difficulty
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const difficulty = searchParams.get('difficulty')
    const mode = searchParams.get('mode')

    // Build where clause
    const where: Record<string, string> = {}
    if (difficulty) where.difficulty = difficulty
    if (mode) where.mode = mode

    // When no filters at all, group by difficulty — fetch up to 10 per difficulty
    if (!difficulty && !mode) {
      const allEntries = await db.leaderboardEntry.findMany({
        orderBy: [{ round: 'desc' }, { life: 'desc' }],
      })

      // Group by difficulty, take top 10 per group
      const grouped: Record<string, typeof allEntries> = {}
      for (const entry of allEntries) {
        if (!grouped[entry.difficulty]) {
          grouped[entry.difficulty] = []
        }
        if (grouped[entry.difficulty].length < 10) {
          grouped[entry.difficulty].push(entry)
        }
      }

      return NextResponse.json(grouped)
    }

    // Specific filter(s) — return top 10
    const entries = await db.leaderboardEntry.findMany({
      where,
      orderBy: [{ round: 'desc' }, { life: 'desc' }],
      take: 10,
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
