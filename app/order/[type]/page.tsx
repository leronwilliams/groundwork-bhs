'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const SERVICE_META: Record<string, { name: string; needsUpload: boolean; needsForm: boolean; desc: string }> = {
  estimate_single: { name: 'Single Trade Estimate', needsUpload: true, needsForm: true, desc: 'Upload your plans and tell us about your project. We\'ll deliver your estimate within 1 business day.' },
  estimate_full: { name: 'Full Project Estimate', needsUpload: true, needsForm: true, desc: 'Upload your plans and complete the project brief. Full estimate delivered within 2 business days.' },
  boq: { name: 'Bill of Quantities', needsUpload: true, needsForm: true, desc: 'Upload your plans. We\'ll produce a full itemised BOQ ready for contractor tendering.' },
  boq_hardware: { name: 'BOQ + Hardware Pricing', needsUpload: true, needsForm: true, desc: 'Upload your plans. BOQ with current Nassau hardware prices delivered within 2 business days.' },
  boq_quotes: { name: 'BOQ + Hardware Store Quotes', needsUpload: true, needsForm: true, desc: 'Upload your plans. We\'ll contact Nassau hardware stores and return real quotes within 3 business days.' },
  permit_prep: { name: 'Permit Document Preparation', needsUpload: false, needsForm: true, desc: 'Complete the project details below. Your permit application package will be prepared within 1 business day.' },
  contract: { name: 'Contractor Agreement', needsUpload: false, needsForm: true, desc: 'Fill in the project and contractor details. Your agreement will be ready within 24 hours.' },
  tax_appeal: { name: 'Property Tax Appeal Letter', needsUpload: false, needsForm: true, desc: 'Provide your assessment details. Your appeal letter will be ready within 24 hours.' },
  lead: { name: 'Contractor Lead', needsUpload: false, needsForm: false, desc: 'Your contractor contact details are now unlocked. Check your dashboard.' },
}

const ISLANDS = ['New Providence (Nassau)', 'Grand Bahama (Freeport)', 'Abaco', 'Eleuthera', 'Exuma', 'Andros', 'Cat Island', 'Long Island', 'Bimini', 'Berry Islands', 'Other']
const PROJECT_TYPES = ['New Build', 'Renovation', 'Addition / Extension', 'Commercial Build', 'Other']
const FINISH_LEVELS = ['Basic', 'Standard', 'Premium', 'Luxury']
const TRADES = ['Foundation', 'Structure / Concrete Block', 'Masonry', 'Roofing', 'Electrical', 'Plumbing', 'Tiling', 'Painting', 'Joinery / Carpentry', 'Landscaping']

export default function OrderDeliveryPage() {
  const params = useParams()
  const type = params?.type as string
  const meta = SERVICE_META[type]

  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    island: '', projectType: '', area: '', floors: '1', finishLevel: 'Standard',
    trades: [] as string[], notes: '', contractorName: '', projectAddress: '',
    assessmentValue: '', appealReason: '',
  })

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy)' }}>
        <div className="text-center">
          <AlertCircle size={48} style={{ color: 'var(--amber)', margin: '0 auto 16px' }} />
          <h2 className="text-xl mb-4">Service not found</h2>
          <Link href="/services" className="text-sm" style={{ color: 'var(--cyan)' }}>Back to Services</Link>
        </div>
      </div>
    )
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') setFile(f)
  }

  function toggleTrade(trade: string) {
    setForm(prev => ({
      ...prev,
      trades: prev.trades.includes(trade) ? prev.trades.filter(t => t !== trade) : [...prev.trades, trade],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Upload file if present
      let fileUrl: string | null = null
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        fileUrl = data.url
      }

      // Submit order details
      await fetch('/api/order-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, fileUrl, brief: form }),
      })
      setSubmitted(true)
    } catch {
      alert('Submission failed. Please try again or contact support.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted || type === 'lead') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
        <div className="max-w-md w-full text-center p-12 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid rgba(5,150,105,0.4)' }}>
          <CheckCircle size={64} style={{ color: '#059669', margin: '0 auto 24px' }} strokeWidth={1.5} />
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Submitted Successfully</h1>
          <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {type === 'lead'
              ? 'Contractor contact details are now visible in your dashboard.'
              : `Your ${meta.name} order is in queue. We'll deliver to your email within the stated timeframe.`}
          </p>
          <Link href="/dashboard" className="block py-3 rounded-sm font-bold text-sm mb-3" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
            Go to Dashboard
          </Link>
          <Link href="/" className="block py-3 rounded-sm font-bold text-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--text-secondary)' }}>
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="section-label mb-4">Order Delivery</div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{meta.name}</h1>
        <p className="mb-10" style={{ color: 'var(--text-secondary)' }}>{meta.desc}</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Plan upload */}
          {meta.needsUpload && (
            <div>
              <label className="block text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--cyan)' }}>
                Upload Plans (PDF, max 50MB)
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('plan-file')?.click()}
                className="cursor-pointer rounded-sm p-10 text-center transition-all"
                style={{
                  border: `2px dashed ${dragOver ? 'var(--cyan)' : 'var(--cyan-border)'}`,
                  background: dragOver ? 'rgba(0,212,245,0.04)' : 'var(--navy-surface)',
                }}
              >
                <Upload size={32} style={{ color: 'var(--cyan)', margin: '0 auto 12px', opacity: 0.7 }} />
                {file ? (
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Drop your PDF here</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>or click to browse</p>
                  </div>
                )}
                <input id="plan-file" type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          )}

          {/* Project brief (estimation services) */}
          {(type.startsWith('estimate') || type.startsWith('boq')) && (
            <div className="space-y-5">
              <label className="block text-sm font-bold mb-1 uppercase tracking-wider" style={{ color: 'var(--cyan)' }}>Project Brief</label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Island / Location</label>
                  <select required value={form.island} onChange={e => setForm(p => ({ ...p, island: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}>
                    <option value="">Select island</option>
                    {ISLANDS.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Project Type</label>
                  <select required value={form.projectType} onChange={e => setForm(p => ({ ...p, projectType: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}>
                    <option value="">Select type</option>
                    {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Total Area (sqft)</label>
                  <input type="number" required placeholder="e.g. 1500" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Floors</label>
                  <select value={form.floors} onChange={e => setForm(p => ({ ...p, floors: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}>
                    {['1','2','3','4'].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Finish Level</label>
                  <select value={form.finishLevel} onChange={e => setForm(p => ({ ...p, finishLevel: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}>
                    {FINISH_LEVELS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {type === 'estimate_single' && (
                <div>
                  <label className="block text-xs mb-2" style={{ color: 'var(--muted)' }}>Trade Required</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TRADES.map(trade => (
                      <label key={trade} className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded-sm" style={{ color: 'var(--text-secondary)' }}>
                        <input type="checkbox" checked={form.trades.includes(trade)} onChange={() => toggleTrade(trade)} className="accent-cyan-400" />
                        {trade}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Permit prep form */}
          {type === 'permit_prep' && (
            <div className="space-y-5">
              <label className="block text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--cyan)' }}>Project Details</label>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Project Address / Lot Number</label>
                <input required placeholder="e.g. Lot 42, Eastern Road, New Providence" value={form.projectAddress} onChange={e => setForm(p => ({ ...p, projectAddress: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Island</label>
                  <select required value={form.island} onChange={e => setForm(p => ({ ...p, island: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}>
                    <option value="">Select island</option>
                    {ISLANDS.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Project Type</label>
                  <select required value={form.projectType} onChange={e => setForm(p => ({ ...p, projectType: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}>
                    <option value="">Select type</option>
                    {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Contractor agreement form */}
          {type === 'contract' && (
            <div className="space-y-5">
              <label className="block text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--cyan)' }}>Contract Details</label>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Contractor Name / Company</label>
                <input required placeholder="e.g. Island Build Co. Ltd." value={form.contractorName} onChange={e => setForm(p => ({ ...p, contractorName: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Project Address</label>
                <input required placeholder="e.g. Lot 12, Blue Hill Road, Nassau" value={form.projectAddress} onChange={e => setForm(p => ({ ...p, projectAddress: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} />
              </div>
            </div>
          )}

          {/* Tax appeal form */}
          {type === 'tax_appeal' && (
            <div className="space-y-5">
              <label className="block text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--amber)' }}>Assessment Details</label>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Current Assessed Value (BSD)</label>
                <input type="number" required placeholder="e.g. 350000" value={form.assessmentValue} onChange={e => setForm(p => ({ ...p, assessmentValue: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Reason for Appeal</label>
                <textarea required rows={3} placeholder="e.g. Property assessed higher than comparable homes on the same road. Recent appraisal shows market value of $280,000." value={form.appealReason} onChange={e => setForm(p => ({ ...p, appealReason: e.target.value }))} className="w-full p-3 rounded-sm text-sm resize-none" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Property Address</label>
                <input required placeholder="e.g. 14 Eastern Road, Nassau" value={form.projectAddress} onChange={e => setForm(p => ({ ...p, projectAddress: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} />
              </div>
            </div>
          )}

          {/* Notes for all services */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Additional Notes (optional)</label>
            <textarea rows={3} placeholder="Any specific requirements, questions, or context..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 rounded-sm text-sm resize-none" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} />
          </div>

          <button
            type="submit"
            disabled={submitting || (meta.needsUpload && !file)}
            className="w-full py-4 rounded-sm font-bold text-sm tracking-wide"
            style={{
              background: 'var(--cyan)',
              color: 'var(--navy)',
              opacity: submitting || (meta.needsUpload && !file) ? 0.6 : 1,
            }}
          >
            {submitting ? 'Submitting...' : `Submit ${meta.name} Order`}
          </button>

          {meta.needsUpload && !file && (
            <p className="text-center text-xs" style={{ color: 'var(--amber)' }}>
              A PDF plan upload is required for this service.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
