'use client'
import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Upload, Download, Loader2, CheckCircle, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const SERVICE_TYPES: Record<string, { name: string; endpoint: string; isBoq: boolean }> = {
  estimate_single: { name: 'Single Trade Estimate', endpoint: '/api/estimate', isBoq: false },
  estimate_full: { name: 'Full Project Estimate', endpoint: '/api/estimate', isBoq: false },
  boq: { name: 'Bill of Quantities', endpoint: '/api/boq', isBoq: true },
  boq_hardware: { name: 'BOQ + Hardware Pricing', endpoint: '/api/boq', isBoq: true },
  boq_quotes: { name: 'BOQ + Hardware Store Quotes', endpoint: '/api/boq', isBoq: true },
}

const ISLANDS = ['New Providence (Nassau)', 'Grand Bahama (Freeport)', 'Abaco', 'Eleuthera', 'Exuma', 'Andros', 'Cat Island', 'Long Island', 'Bimini', 'Berry Islands', 'Other']
const PROJECT_TYPES = ['New Build', 'Renovation', 'Addition / Extension', 'Commercial Build', 'Other']
const FINISH_LEVELS = ['Basic', 'Standard', 'Premium', 'Luxury']
const TRADES = ['Foundation', 'Structure / Concrete Block', 'Masonry', 'Roofing', 'Electrical', 'Plumbing', 'Tiling', 'Painting', 'Joinery / Carpentry', 'Landscaping']

export default function EstimatePage() {
  const params = useParams()
  const orderId = params?.orderId as string

  // Parse serviceType from orderId format: "estimate_single|<id>" or just use state
  const [serviceType, setServiceType] = useState('estimate_full')

  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  const [brief, setBrief] = useState({ island: '', projectType: '', area: '', floors: '1', finishLevel: 'Standard', trades: [] as string[], notes: '' })

  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const resultRef = useRef<HTMLDivElement>(null)

  async function handleFileSelect(f: File) {
    if (f.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return }
    if (f.size > 50 * 1024 * 1024) { setError('File exceeds 50MB limit.'); return }
    setFile(f)
    setError('')
    setUploading(true)
    setUploadProgress(10)
    try {
      const fd = new FormData()
      fd.append('file', f)
      setUploadProgress(40)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      setUploadProgress(80)
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed')
      setFileUrl(data.url)
      setUploadProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setFile(null)
    } finally {
      setUploading(false)
    }
  }

  function toggleTrade(trade: string) {
    setBrief(prev => ({ ...prev, trades: prev.trades.includes(trade) ? prev.trades.filter(t => t !== trade) : [...prev.trades, trade] }))
  }

  async function handleGenerate() {
    if (!brief.island || !brief.projectType) { setError('Please fill in island and project type.'); return }
    setGenerating(true)
    setResult('')
    setDone(false)
    setError('')

    const meta = SERVICE_TYPES[serviceType]
    try {
      const res = await fetch(meta.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, brief, orderId, serviceType }),
      })

      if (!res.ok) throw new Error('Generation failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No stream')

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        const chunk = decoder.decode(value, { stream: true })
        setResult(prev => prev + chunk)
        // Auto-scroll
        if (resultRef.current) resultRef.current.scrollTop = resultRef.current.scrollHeight
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDownloadPDF() {
    if (!result) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const meta = SERVICE_TYPES[serviceType]
    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    // Header
    doc.setFillColor(6, 13, 26)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(0, 212, 245)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('GROUNDWORK BHS', 15, 18)
    doc.setFontSize(10)
    doc.setTextColor(180, 197, 224)
    doc.text(meta.name.toUpperCase(), 15, 28)
    doc.text(`Generated: ${now}`, 15, 35)

    // Brief summary
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    let y = 50
    doc.setFont('helvetica', 'bold')
    doc.text('PROJECT BRIEF', 15, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    const briefLines = [
      `Island: ${brief.island}`,
      `Project Type: ${brief.projectType}`,
      `Area: ${brief.area || 'N/A'} sqft  |  Floors: ${brief.floors}  |  Finish: ${brief.finishLevel}`,
      brief.trades.length > 0 ? `Trades: ${brief.trades.join(', ')}` : '',
      brief.notes ? `Notes: ${brief.notes}` : '',
    ].filter(Boolean)
    briefLines.forEach(line => { doc.text(line, 15, y); y += 5 })
    y += 4

    // Divider
    doc.setDrawColor(0, 212, 245)
    doc.line(15, y, 195, y)
    y += 6

    // Main result text
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(20, 20, 20)
    const lines = doc.splitTextToSize(result, 180)
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      // Bold section headers
      if (line.startsWith('##') || line.match(/^\d+\./)) {
        doc.setFont('helvetica', 'bold')
        doc.text(line.replace(/^#+\s*/, ''), 15, y)
        doc.setFont('helvetica', 'normal')
      } else {
        doc.text(line, 15, y)
      }
      y += 5
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text('This is an estimate only. Engage a licensed quantity surveyor for formal certification. © 2026 Groundwork BHS', 15, 290)
      doc.text(`Page ${i} of ${pageCount}`, 185, 290, { align: 'right' })
    }

    doc.save(`groundwork-${serviceType}-${Date.now()}.pdf`)
  }

  const meta = SERVICE_TYPES[serviceType]

  return (
    <div className="min-h-screen pt-24 pb-20" style={{ background: 'var(--navy)' }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="section-label mb-4">Estimation Engine</div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {meta?.name || 'Estimate'}
        </h1>
        <p className="mb-10" style={{ color: 'var(--text-secondary)' }}>
          Upload your plans and fill in the project brief. Our AI quantity surveyor will generate a detailed estimate using claude-opus-4-6.
        </p>

        {!done ? (
          <div className="space-y-8">
            {/* Service type selector */}
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--cyan)' }}>Service Type</label>
              <select
                value={serviceType}
                onChange={e => setServiceType(e.target.value)}
                className="w-full p-3 rounded-sm text-sm"
                style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}
              >
                {Object.entries(SERVICE_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val.name}</option>
                ))}
              </select>
            </div>

            {/* Plan Upload */}
            <div>
              <label className="block text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--cyan)' }}>
                Architectural Plans (PDF, max 50MB) — optional but recommended
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
                onClick={() => document.getElementById('plan-upload')?.click()}
                className="cursor-pointer rounded-sm p-10 text-center transition-all"
                style={{ border: `2px dashed ${dragOver ? 'var(--cyan)' : 'var(--cyan-border)'}`, background: dragOver ? 'rgba(0,212,245,0.04)' : 'var(--navy-surface)' }}
              >
                {uploading ? (
                  <div>
                    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--cyan)', margin: '0 auto 12px' }} />
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Uploading... {uploadProgress}%</p>
                    <div className="mt-3 h-1 rounded-full mx-auto" style={{ background: 'var(--navy-card)', width: '200px' }}>
                      <div className="h-1 rounded-full transition-all" style={{ background: 'var(--cyan)', width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : fileUrl ? (
                  <div>
                    <CheckCircle size={32} style={{ color: '#059669', margin: '0 auto 12px' }} />
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{file?.name}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Uploaded successfully — click to replace</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} style={{ color: 'var(--cyan)', margin: '0 auto 12px', opacity: 0.7 }} />
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Drop your PDF plans here</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>or click to browse • max 50MB</p>
                  </div>
                )}
                <input id="plan-upload" type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
              </div>
            </div>

            {/* Project Brief */}
            <div className="space-y-5">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--cyan)' }}>Project Brief</label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Island / Location *</label>
                  <select required value={brief.island} onChange={e => setBrief(p => ({ ...p, island: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}>
                    <option value="">Select island</option>
                    {ISLANDS.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Project Type *</label>
                  <select required value={brief.projectType} onChange={e => setBrief(p => ({ ...p, projectType: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}>
                    <option value="">Select type</option>
                    {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Total Area (sqft)</label>
                  <input type="number" placeholder="e.g. 1500" value={brief.area} onChange={e => setBrief(p => ({ ...p, area: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Floors</label>
                  <select value={brief.floors} onChange={e => setBrief(p => ({ ...p, floors: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}>
                    {['1','2','3','4'].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Finish Level</label>
                  <select value={brief.finishLevel} onChange={e => setBrief(p => ({ ...p, finishLevel: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}>
                    {FINISH_LEVELS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: 'var(--muted)' }}>Trades Required</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRADES.map(trade => (
                    <label key={trade} className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded-sm" style={{ color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={brief.trades.includes(trade)} onChange={() => toggleTrade(trade)} className="accent-cyan-400" />
                      {trade}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Special Requirements / Notes</label>
                <textarea rows={3} placeholder="e.g. Hurricane resistant design required, cistern included, solar panel prep..." value={brief.notes} onChange={e => setBrief(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 rounded-sm text-sm resize-none" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <AlertCircle size={16} style={{ color: '#ef4444' }} />
                <span className="text-sm" style={{ color: '#ef4444' }}>{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || uploading || !brief.island || !brief.projectType}
              className="w-full py-4 rounded-sm font-bold text-sm tracking-wide flex items-center justify-center gap-2"
              style={{ background: 'var(--cyan)', color: 'var(--navy)', opacity: generating || uploading || !brief.island || !brief.projectType ? 0.6 : 1 }}
            >
              {generating ? (
                <><Loader2 size={16} className="animate-spin" /> Generating with claude-opus-4-6...</>
              ) : (
                <><FileText size={16} /> Generate {meta?.isBoq ? 'Bill of Quantities' : 'Cost Estimate'}</>
              )}
            </button>
          </div>
        ) : null}

        {/* Streaming result */}
        {(generating || result) && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {generating ? (
                  <><Loader2 size={16} className="animate-spin" style={{ color: 'var(--cyan)' }} /><span className="text-sm font-bold" style={{ color: 'var(--cyan)' }}>Generating...</span></>
                ) : (
                  <><CheckCircle size={16} style={{ color: '#059669' }} /><span className="text-sm font-bold" style={{ color: '#059669' }}>Complete — saved to your account</span></>
                )}
              </div>
              {done && (
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-sm font-bold text-xs"
                  style={{ background: 'var(--amber)', color: '#1a0f00' }}
                >
                  <Download size={14} /> Download PDF
                </button>
              )}
            </div>

            <div
              ref={resultRef}
              className="p-6 rounded-sm font-mono text-sm leading-relaxed overflow-y-auto"
              style={{
                background: 'var(--navy-surface)',
                border: '1px solid var(--cyan-border)',
                maxHeight: '70vh',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {result}
              {generating && <span className="animate-pulse" style={{ color: 'var(--cyan)' }}>▋</span>}
            </div>

            {done && (
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => { setResult(''); setDone(false); setFile(null); setFileUrl(null); setUploadProgress(0) }}
                  className="flex-1 py-3 rounded-sm font-bold text-sm"
                  style={{ border: '1px solid var(--cyan-border)', color: 'var(--text-secondary)' }}
                >
                  Generate Another
                </button>
                <Link
                  href="/dashboard"
                  className="flex-1 py-3 rounded-sm font-bold text-sm text-center"
                  style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
                >
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
