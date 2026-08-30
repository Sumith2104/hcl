import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const rows = await fb.fluxbase.query(
      `SELECT * FROM learning_goal WHERE user_id = '${fb.escapeSql(userId)}' ORDER BY created_at DESC`
    )

    const goals = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      deadline: r.deadline,
      progress: r.progress,
      category: r.category,
      completed: r.completed,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))

    return NextResponse.json({ goals })
  } catch (error) {
    const err = dbError(error, 'GetLearningGoals')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const body = await req.json()
    const { userId, title, description = '', deadline = null, category = '' } = body

    if (!userId || !title) {
      return NextResponse.json(
        { error: 'userId and title are required' },
        { status: 400 }
      )
    }

    const id = fb.qid()
    const deadlineVal = deadline ? `'${fb.escapeSql(deadline)}'` : 'NULL'

    const rows = await fb.fluxbase.run(
      `INSERT INTO learning_goal (id, user_id, title, description, deadline, progress, category, completed, created_at, updated_at) VALUES (${id}, '${fb.escapeSql(userId)}', '${fb.escapeSql(title)}', '${fb.escapeSql(description)}', ${deadlineVal}, 0, '${fb.escapeSql(category)}', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`
    )

    const goal = rows[0]
    return NextResponse.json(
      {
        goal: {
          id: goal.id,
          title: goal.title,
          description: goal.description,
          deadline: goal.deadline,
          progress: goal.progress,
          category: goal.category,
          completed: goal.completed,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const err = dbError(error, 'CreateLearningGoal')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const body = await req.json()
    const { goalId, progress, completed, title, description, deadline } = body

    if (!goalId) {
      return NextResponse.json({ error: 'goalId is required' }, { status: 400 })
    }

    // Build SET clauses dynamically
    const setClauses: string[] = []
    setClauses.push("updated_at = CURRENT_TIMESTAMP")

    if (progress !== undefined) {
      setClauses.push(`progress = ${Number(progress)}`)
    }
    if (completed !== undefined) {
      const completedVal = completed ? 'TRUE' : 'FALSE'
      setClauses.push(`completed = ${completedVal}`)
      if (completed) {
        setClauses.push('progress = 100')
      }
    }
    if (title !== undefined) {
      setClauses.push(`title = '${fb.escapeSql(title)}'`)
    }
    if (description !== undefined) {
      setClauses.push(`description = '${fb.escapeSql(description)}'`)
    }
    if (deadline !== undefined) {
      const deadlineVal = deadline ? `'${fb.escapeSql(deadline)}'` : 'NULL'
      setClauses.push(`deadline = ${deadlineVal}`)
    }

    const rows = await fb.fluxbase.run(
      `UPDATE learning_goal SET ${setClauses.join(', ')} WHERE id = '${fb.escapeSql(goalId)}' RETURNING *`
    )

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const goal = rows[0]
    return NextResponse.json({
      goal: {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        deadline: goal.deadline,
        progress: goal.progress,
        category: goal.category,
        completed: goal.completed,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      },
    })
  } catch (error) {
    const err = dbError(error, 'UpdateLearningGoal')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Goal id is required' }, { status: 400 })
    }

    await fb.fluxbase.execute(
      `DELETE FROM learning_goal WHERE id = '${fb.escapeSql(id)}'`
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    const err = dbError(error, 'DeleteLearningGoal')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
