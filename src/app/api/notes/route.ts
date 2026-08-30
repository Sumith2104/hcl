import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const notes = await fb.fluxbase.query(`SELECT * FROM LearningNote WHERE user_id = '${fb.escapeSql(userId)}' ORDER BY is_pinned DESC, updated_at DESC`)

    return NextResponse.json({ notes })
  } catch (error) {
    const err = dbError(error, 'GetNotes')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const body = await req.json()
    const { userId, noteId, action } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Handle pin/unpin/delete actions
    if (action && noteId) {
      const existingNote = await fb.fluxbase.query(`SELECT * FROM LearningNote WHERE id = '${fb.escapeSql(noteId)}' LIMIT 1`)
      if (existingNote.length === 0 || existingNote[0].userId !== userId) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 })
      }

      if (action === 'pin') {
        const rows = await fb.fluxbase.run(`UPDATE LearningNote SET is_pinned = true, updated_at = CURRENT_TIMESTAMP WHERE id = '${fb.escapeSql(noteId)}' RETURNING *`)
        return NextResponse.json({ note: rows[0] })
      }

      if (action === 'unpin') {
        const rows = await fb.fluxbase.run(`UPDATE LearningNote SET is_pinned = false, updated_at = CURRENT_TIMESTAMP WHERE id = '${fb.escapeSql(noteId)}' RETURNING *`)
        return NextResponse.json({ note: rows[0] })
      }

      if (action === 'delete') {
        await fb.fluxbase.execute(`DELETE FROM LearningNote WHERE id = '${fb.escapeSql(noteId)}'`)
        return NextResponse.json({ success: true })
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Handle update
    if (noteId) {
      const { title, content, category, tags, isPinned } = body

      const existingNote = await fb.fluxbase.query(`SELECT * FROM LearningNote WHERE id = '${fb.escapeSql(noteId)}' LIMIT 1`)
      if (existingNote.length === 0 || existingNote[0].userId !== userId) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 })
      }

      const setParts: string[] = [`updated_at = CURRENT_TIMESTAMP`]
      if (title !== undefined) setParts.push(`title = '${fb.escapeSql(title)}'`)
      if (content !== undefined) setParts.push(`content = '${fb.escapeSql(content)}'`)
      if (category !== undefined) setParts.push(`category = '${fb.escapeSql(category)}'`)
      if (tags !== undefined) setParts.push(`tags = '${fb.escapeSql(tags)}'`)
      if (isPinned !== undefined) setParts.push(`is_pinned = ${isPinned}`)

      const rows = await fb.fluxbase.run(`UPDATE LearningNote SET ${setParts.join(', ')} WHERE id = '${fb.escapeSql(noteId)}' RETURNING *`)
      return NextResponse.json({ note: rows[0] })
    }

    // Handle create
    const { title, content, category = 'general', tags = '' } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }

    const rows = await fb.fluxbase.run(`INSERT INTO LearningNote (id, user_id, title, content, category, tags, is_pinned, created_at, updated_at) VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', '${fb.escapeSql(title)}', '${fb.escapeSql(content)}', '${fb.escapeSql(category)}', '${fb.escapeSql(tags)}', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`)

    return NextResponse.json({ note: rows[0] })
  } catch (error) {
    const err = dbError(error, 'NotesPost')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
