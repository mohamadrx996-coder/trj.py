'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [tab, setTab] = useState('copy')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState('')

  // Copy
  const [copyToken, setCopyToken] = useState('')
  const [copySource, setCopySource] = useState('')
  const [copyTarget, setCopyTarget] = useState('')
  const [copyOpts, setCopyOpts] = useState({ settings: true, roles: true, channels: true })

  // Macro
  const [macroToken, setMacroToken] = useState('')
  const [macroChannel, setMacroChannel] = useState('')
  const [macroMsgs, setMacroMsgs] = useState('')
  const [macroDuration, setMacroDuration] = useState('60')
  const [macroSpeed, setMacroSpeed] = useState('0.5')
  const [macroCount, setMacroCount] = useState('0')
  const [macroMode, setMacroMode] = useState('duration')

  // Nuker
  const [nukerToken, setNukerToken] = useState('')
  const [nukerBotToken, setNukerBotToken] = useState('')
  const [nukerGuild, setNukerGuild] = useState('')
  const [nukerAction, setNukerAction] = useState('')
  const [nukerUseBot, setNukerUseBot] = useState(false)
  const [nukerSpamMsg, setNukerSpamMsg] = useState('@everyone TROJAN WAS HERE')
  const [nukerServerName, setNukerServerName] = useState('NUKED BY TRJ')

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState('')

  const sendWebhook = async (action: string, details: object) => {
    if (!webhookUrl) return
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'TRJ BOT',
          avatar_url: 'https://i.imgur.com/YourAvatar.png',
          embeds: [{
            title: '⚡ ' + action,
            color: 0xFF0000,
            fields: Object.entries(details).map(([k, v]) => ({ name: k, value: String(v), inline: true })),
            timestamp: new Date().toISOString(),
            footer: { text: 'TRJ BOT - Dev by Trj.py' }
          }]
        })
      })
    } catch {}
  }

  const doCopy = async () => {
    if (!copyToken || !copySource || !copyTarget) return setStatus('❌ املأ كل الحقول')
    setLoading(true); setStatus('⏳ جاري النسخ...')
    await sendWebhook('نسخ سيرفر', { 'السيرفر المصدر': copySource, 'السيرفر الهدف': copyTarget })
    
    try {
      const r = await fetch('/api/copy', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: copyToken, sourceId: copySource, targetId: copyTarget, options: copyOpts }) 
      })
      const d = await r.json()
      setStatus(d.success ? '✅ تم النسخ بنجاح!' : '❌ ' + d.error)
      setResult(d.success ? `الرتب: ${d.stats.roles}\nالتصنيفات: ${d.stats.cats}\nالرومات النصية: ${d.stats.txt}\nالرومات الصوتية: ${d.stats.voice}` : '')
    } catch { setStatus('❌ خطأ في الاتصال') }
    setLoading(false)
  }

  const doMacro = async () => {
    if (!macroToken || !macroChannel || !macroMsgs) return setStatus('❌ املأ كل الحقول')
    setLoading(true); setStatus('⏳ جاري الإرسال...')
    await sendWebhook('بدء ماكرو', { 'الروم': macroChannel, 'عدد الرسائل': macroMsgs.split('\n').filter(m => m).length })
    
    try {
      const body: any = { 
        token: macroToken, 
        channelId: macroChannel, 
        messages: macroMsgs.split('\n').filter(m => m), 
        speed: parseFloat(macroSpeed) || 0.5 
      }
      
      if (macroMode === 'duration') {
        body.duration = parseInt(macroDuration) || 60
      } else {
        body.count = parseInt(macroCount) || 100
      }
      
      const r = await fetch('/api/macro', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body) 
      })
      const d = await r.json()
      setStatus(d.success ? `✅ تم إرسال ${d.sent} رسالة!` : '❌ ' + d.error)
      setResult(d.failed > 0 ? `فشل: ${d.failed} رسالة` : '')
    } catch { setStatus('❌ خطأ في الاتصال') }
    setLoading(false)
  }

  const doNuker = async () => {
    if (!nukerGuild || !nukerAction) return setStatus('❌ اختر العملية')
    if (!nukerUseBot && !nukerToken) return setStatus('❌ أدخل التوكن')
    if (nukerUseBot && !nukerBotToken) return setStatus('❌ أدخل توكن البوت')
    
    setLoading(true); setStatus('⏳ جاري التنفيذ...')
    await sendWebhook('نيوكر', { 'السيرفر': nukerGuild, 'العملية': nukerAction, 'نوع التوكن': nukerUseBot ? 'Bot Token' : 'User Token' })
    
    try {
      const token = nukerUseBot ? `Bot ${nukerBotToken}` : nukerToken
      const r = await fetch('/api/nuker', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          guildId: nukerGuild, 
          action: nukerAction,
          spamMessage: nukerSpamMsg,
          serverName: nukerServerName
        }) 
      })
      const d = await r.json()
      setStatus(d.success ? '✅ تم التنفيذ بنجاح!' : '❌ ' + d.error)
      if (d.success && d.stats) {
        setResult(`محذوف: ${d.stats.deleted}\nممنوع: ${d.stats.banned}\nمنشور: ${d.stats.spam_sent}\nمنشأ: ${d.stats.created}`)
      }
    } catch { setStatus('❌ خطأ في الاتصال') }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-red-500/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center font-bold text-xl">
                T
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  TRJ BOT
                </h1>
                <p className="text-xs text-gray-400">Advanced Discord Tools</p>
              </div>
            </div>
            <div className="hidden md:block text-gray-500 text-sm">Dev: Trj.py</div>
          </div>
        </div>
      </header>

      {/* Webhook Settings */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🔔</span>
            <span className="text-sm text-gray-300">Webhook (اختياري)</span>
          </div>
          <input 
            type="text" 
            placeholder="رابط الويب هوك - يرسل إشعار عند كل عملية"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            className="w-full p-2.5 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-red-500 outline-none text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'copy', label: '📋 نسخ سيرفر', color: 'from-blue-500 to-cyan-500' },
            { id: 'nuker', label: '💀 نيوكر', color: 'from-red-500 to-orange-500' },
            { id: 'macro', label: '⚡ ماكرو', color: 'from-purple-500 to-pink-500' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => { setTab(t.id); setStatus(''); setResult('') }}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-bold transition-all text-sm md:text-base ${
                tab === t.id 
                  ? `bg-gradient-to-r ${t.color} text-white shadow-lg shadow-red-500/25` 
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Copy Section */}
          {tab === 'copy' && (
            <>
              <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50 shadow-xl">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  نسخ سيرفر
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">التوكن</label>
                    <input 
                      type="password" 
                      placeholder="توكن حسابك"
                      value={copyToken}
                      onChange={e => setCopyToken(e.target.value)}
                      className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">أيدي المصدر</label>
                      <input 
                        placeholder="Source ID"
                        value={copySource}
                        onChange={e => setCopySource(e.target.value)}
                        className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">أيدي الهدف</label>
                      <input 
                        placeholder="Target ID"
                        value={copyTarget}
                        onChange={e => setCopyTarget(e.target.value)}
                        className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-2">
                    {[
                      { k: 'settings', l: '⚙️ الإعدادات' },
                      { k: 'roles', l: '🎭 الرتب' },
                      { k: 'channels', l: '📺 الرومات' }
                    ].map(o => (
                      <label key={o.k} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={copyOpts[o.k as keyof typeof copyOpts]}
                          onChange={e => setCopyOpts(p => ({ ...p, [o.k]: e.target.checked }))} 
                          className="w-4 h-4 accent-blue-500" 
                        />
                        <span className="text-sm">{o.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50 shadow-xl flex flex-col">
                <h3 className="text-lg font-bold mb-4">📝 معلومات</h3>
                <div className="flex-1 space-y-3 text-gray-300 text-sm">
                  <p>• ينسخ جميع الرتب والرومات من سيرفر لآخر</p>
                  <p>• يجب أن يكون لديك صلاحيات الأدمن في كلا السيرفرين</p>
                  <p>• الرتب تُنسخ بالترتيب الصحيح (من الأعلى للأدنى)</p>
                  <p>• الرومات تُنسخ مع تصنيفاتها وإعداداتها</p>
                </div>
                <button 
                  onClick={doCopy} 
                  disabled={loading}
                  className="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                  {loading ? '⏳ جاري...' : '🚀 بدء النسخ'}
                </button>
              </div>
            </>
          )}

          {/* Nuker Section */}
          {tab === 'nuker' && (
            <>
              <div className="bg-slate-800/60 rounded-xl p-5 border border-red-500/30 shadow-xl shadow-red-500/10">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-400">
                  <span className="text-xl">💀</span>
                  نيوكر السيرفر
                </h2>
                <div className="space-y-3">
                  <div className="flex gap-2 mb-3">
                    <button 
                      onClick={() => setNukerUseBot(false)}
                      className={`flex-1 py-2 rounded-lg text-sm transition-all ${!nukerUseBot ? 'bg-red-500 text-white' : 'bg-slate-700 text-gray-400'}`}
                    >
                      توكن حساب
                    </button>
                    <button 
                      onClick={() => setNukerUseBot(true)}
                      className={`flex-1 py-2 rounded-lg text-sm transition-all ${nukerUseBot ? 'bg-green-500 text-white' : 'bg-slate-700 text-gray-400'}`}
                    >
                      توكن بوت ⚡
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      {nukerUseBot ? 'توكن البوت (أسرع)' : 'توكن الحساب'}
                    </label>
                    <input 
                      type="password" 
                      placeholder={nukerUseBot ? 'Bot Token...' : 'User Token...'}
                      value={nukerUseBot ? nukerBotToken : nukerToken}
                      onChange={e => nukerUseBot ? setNukerBotToken(e.target.value) : setNukerToken(e.target.value)}
                      className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-red-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">أيدي السيرفر</label>
                    <input 
                      placeholder="Server ID"
                      value={nukerGuild}
                      onChange={e => setNukerGuild(e.target.value)}
                      className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-red-500 outline-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'nuke', l: '💥 نيكر كامل' },
                      { id: 'banall', l: '🔨 حظر الكل' },
                      { id: 'delete_channels', l: '🗑️ حذف رومات' },
                      { id: 'spam', l: '📧 سبام' }
                    ].map(a => (
                      <button 
                        key={a.id} 
                        onClick={() => setNukerAction(a.id)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${nukerAction === a.id ? 'bg-red-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                      >
                        {a.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/60 rounded-xl p-5 border border-red-500/30 shadow-xl shadow-red-500/10">
                <h3 className="text-lg font-bold mb-4 text-red-400">⚙️ إعدادات إضافية</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">اسم السيرفر بعد النيكر</label>
                    <input 
                      placeholder="NUKED BY TRJ"
                      value={nukerServerName}
                      onChange={e => setNukerServerName(e.target.value)}
                      className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-red-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">رسالة السبام</label>
                    <input 
                      placeholder="@everyone TROJAN WAS HERE"
                      value={nukerSpamMsg}
                      onChange={e => setNukerSpamMsg(e.target.value)}
                      className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-red-500 outline-none"
                    />
                  </div>
                  
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-red-400 text-sm">⚠️ تحذير: هذه العمليات خطيرة ولا يمكن التراجع عنها!</p>
                  </div>
                  
                  <button 
                    onClick={doNuker} 
                    disabled={loading || !nukerAction}
                    className="w-full py-3.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg font-bold disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-red-500/25"
                  >
                    {loading ? '⏳ جاري...' : '🔥 تنفيذ'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Macro Section */}
          {tab === 'macro' && (
            <>
              <div className="bg-slate-800/60 rounded-xl p-5 border border-purple-500/30 shadow-xl shadow-purple-500/10">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-400">
                  <span className="text-xl">⚡</span>
                  ماكرو سبام
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">التوكن</label>
                    <input 
                      type="password" 
                      placeholder="التوكن"
                      value={macroToken}
                      onChange={e => setMacroToken(e.target.value)}
                      className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">أيدي الروم</label>
                    <input 
                      placeholder="Channel ID"
                      value={macroChannel}
                      onChange={e => setMacroChannel(e.target.value)}
                      className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">الرسائل (كل سطر رسالة)</label>
                    <textarea 
                      placeholder="رسالة 1&#10;رسالة 2&#10;رسالة 3"
                      value={macroMsgs}
                      onChange={e => setMacroMsgs(e.target.value)} 
                      rows={4}
                      className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-purple-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/60 rounded-xl p-5 border border-purple-500/30 shadow-xl shadow-purple-500/10">
                <h3 className="text-lg font-bold mb-4 text-purple-400">⚙️ إعدادات</h3>
                <div className="space-y-3">
                  <div className="flex gap-2 mb-3">
                    <button 
                      onClick={() => setMacroMode('duration')}
                      className={`flex-1 py-2 rounded-lg text-sm transition-all ${macroMode === 'duration' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-gray-400'}`}
                    >
                      بالمدة
                    </button>
                    <button 
                      onClick={() => setMacroMode('count')}
                      className={`flex-1 py-2 rounded-lg text-sm transition-all ${macroMode === 'count' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-gray-400'}`}
                    >
                      بالعدد
                    </button>
                  </div>
                  
                  {macroMode === 'duration' ? (
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">المدة (ثواني)</label>
                      <input 
                        type="number" 
                        placeholder="60"
                        value={macroDuration}
                        onChange={e => setMacroDuration(e.target.value)}
                        className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">عدد الرسائل</label>
                      <input 
                        type="number" 
                        placeholder="100"
                        value={macroCount}
                        onChange={e => setMacroCount(e.target.value)}
                        className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">السرعة (ثواني بين كل رسالة)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      placeholder="0.5"
                      value={macroSpeed}
                      onChange={e => setMacroSpeed(e.target.value)}
                      className="w-full p-3 bg-slate-900/80 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                    />
                  </div>
                  
                  <button 
                    onClick={doMacro} 
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-purple-500/25"
                  >
                    {loading ? '⏳ جاري...' : '🚀 بدء الماكرو'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Status & Result */}
        {(status || result) && (
          <div className="mt-6 max-w-6xl mx-auto">
            {status && (
              <div className={`p-4 rounded-lg mb-3 ${status.includes('✅') ? 'bg-green-500/20 border border-green-500/30 text-green-400' : status.includes('⏳') ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
                {status}
              </div>
            )}
            {result && (
              <pre className="p-4 bg-slate-800/80 rounded-lg text-sm text-gray-300 overflow-auto whitespace-pre-wrap border border-slate-700">
                {result}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm py-6 border-t border-slate-800">
        <p>TRJ BOT - Developed by <span className="text-red-400">Trj.py</span></p>
        <p className="text-xs mt-1 text-gray-600">Use responsibly. Not responsible for any misuse.</p>
      </footer>
    </main>
  )
}
