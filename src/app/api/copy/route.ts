import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { token, sourceId, targetId, options } = await req.json()
    
    if (!token || !sourceId || !targetId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    const stats = { roles: 0, txt: 0, voice: 0, cats: 0 }
    const roleMap: Record<string, string> = {}
    const catMap: Record<string, string> = {}
    
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
    
    const api = async (method: string, endpoint: string, body?: object) => {
      try {
        const res = await fetch(`https://discord.com/api/v10/${endpoint}`, {
          method,
          headers: { 
            'Authorization': token, 
            'Content-Type': 'application/json' 
          },
          body: body ? JSON.stringify(body) : undefined
        })
        
        if (res.status === 204) return { success: true }
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}))
          await sleep(((data as any).retry_after || 1) * 1000)
          return api(method, endpoint, body)
        }
        return res.json().catch(() => ({}))
      } catch {
        return {}
      }
    }

    // Fetch source data
    const roles = await api('GET', `guilds/${sourceId}/roles`)
    const channels = await api('GET', `guilds/${sourceId}/channels`)
    const targetRoles = await api('GET', `guilds/${targetId}/roles`)

    if (!Array.isArray(roles) || !Array.isArray(channels)) {
      return NextResponse.json({ error: 'فشل جلب البيانات من السيرفر المصدر' }, { status: 400 })
    }

    const targetEveryone = Array.isArray(targetRoles) 
      ? targetRoles.find((r: any) => r.name === '@everyone') 
      : null

    // Copy roles (highest to lowest position)
    if (options?.roles) {
      const srcEveryone = roles.find((r: any) => r.name === '@everyone')
      
      // Update @everyone permissions
      if (srcEveryone && targetEveryone) {
        await api('PATCH', `guilds/${targetId}/roles/${targetEveryone.id}`, { 
          permissions: srcEveryone.permissions 
        })
      }

      // Sort roles by position (highest first) and create them
      const toCreate = roles
        .filter((r: any) => r.name !== '@everyone' && !r.managed)
        .sort((a: any, b: any) => (b.position || 0) - (a.position || 0))

      for (const r of toCreate) {
        const newRole = await api('POST', `guilds/${targetId}/roles`, { 
          name: r.name, 
          color: r.color, 
          hoist: r.hoist, 
          mentionable: r.mentionable, 
          permissions: r.permissions 
        })
        
        if ((newRole as any).id) {
          roleMap[r.id] = (newRole as any).id
          stats.roles++
        }
        await sleep(100)
      }
    }

    // Copy channels
    if (options?.channels) {
      // First, create categories (sorted by position)
      const categories = channels
        .filter((c: any) => c.type === 4)
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))

      for (const c of categories) {
        const newCat = await api('POST', `guilds/${targetId}/channels`, { 
          name: c.name, 
          type: 4 
        })
        
        if ((newCat as any).id) {
          catMap[c.id] = (newCat as any).id
          stats.cats++
        }
        await sleep(100)
      }

      // Then create channels (sorted by position)
      const chs = channels
        .filter((c: any) => c.type !== 4)
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))

      for (const c of chs) {
        const payload: any = { 
          name: c.name, 
          type: c.type, 
          nsfw: c.nsfw || false 
        }
        
        if (c.parent_id && catMap[c.parent_id]) {
          payload.parent_id = catMap[c.parent_id]
        }
        if (c.type === 0 && c.topic) {
          payload.topic = c.topic
        }
        if (c.type === 2) {
          payload.bitrate = c.bitrate || 64000
          payload.user_limit = c.user_limit || 0
        }
        
        await api('POST', `guilds/${targetId}/channels`, payload)
        
        if (c.type === 0) stats.txt++
        else if (c.type === 2) stats.voice++
        
        await sleep(100)
      }
    }

    // Copy server settings
    if (options?.settings) {
      const guild = await api('GET', `guilds/${sourceId}`)
      if (guild && !((guild as any).message)) {
        await api('PATCH', `guilds/${targetId}`, {
          name: (guild as any).name,
          description: (guild as any).description,
          verification_level: (guild as any).verification_level,
          default_message_notifications: (guild as any).default_message_notifications,
          explicit_content_filter: (guild as any).explicit_content_filter
        })
      }
    }

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
