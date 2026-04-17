'use client'
import { useState } from 'react'
import { Upload, CheckCircle, Loader2, AlertCircle, Download, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

const ISLANDS = ['New Providence (Nassau)', 'Grand Bahama (Freeport)', 'Abaco', 'Eleuthera', 'Exuma', 'Andros', 'Long Island', 'Cat Island', 'Bimini', 'Berry Islands', 'San Salvador', 'Inagua', 'Other']

type Step = 'upload' | 'dimensions' | 'processing' | 'results'
type Confidence = 'high' | 'medium' | 'low'

interface LineItem {
  itemCode: string; description: string; quantity: number; unit: string
  unitPrice: number; totalPrice: number; confidence: Confidence; trade: string
}

interface BOQResult {
  assessment: { qualityScore: number; warnings: string[]; recommendation: string }
  confidence: { highPct: number; mediumPct: number; lowPct: number; overallScore: number }
  summary: { grandTotalLow: number; grandTotalHigh: number; materialsCostLow: number; labourEstimateLow: number; permitFees: number; contingency: number }
  trades: { trade: string; itemCount: number; subtotalLow: number; subtotalHigh: number }[]
  lineItems: LineItem[]
  reportUrl: string | null
}

export default function BOQWizardPage() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dims, setDims] = useState({
    totalFloorArea: '', numberOfFloors: '1', wallHeight: '9',
    foundationType: 'slab', roofType: 'hip', roofMaterial: 'galvanize',
    numberOfDoors: '4', numberOfWindows: '8', numberOfSlidingDoors: '2',
    numberOfBedrooms: '3', numberOfBathrooms: '2',
    hasGarage: false, hasPool: false, hasGeneratorRoom: false, hasCoveredPatio: false, patioArea: '0',
    island: 'New Providence (Nassau)', finishLevel: 'standard', specialRequirements: '',
  })
  const [, setProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState('')
  const [result, setResult] = useState<BOQResult | null>(null)
  const [error, setError] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [shoppingList, setShoppingList] = useState<{ supplier: string; items: LineItem[]; subtotal: number }[] | null>(null)
  const [showWhySection, setShowWhySection] = useState(false)

  async function handleFileSelect(f: File) {
    if (f.type !== 'application/pdf') { setError('Only PDF files accepted.'); return }
    if (f.size > 50 * 1024 * 1024) { setError('File exceeds 50MB.'); return }
    setFile(f); setError('')
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', f)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFileUrl(data.url)
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); setFile(null) }
    finally { setUploading(false) }
  }

  async function handleGenerate() {
    setProcessing(true); setError(''); setStep('processing')
    const stages = [
      'Assessing drawing quality...',
      'Running Claude Opus takeoff...',
      'Running GPT-4o cross-validation...',
      'Applying formula engine...',
      'Calculating confidence scores...',
      'Generating PDF report...',
    ]
    let i = 0
    const interval = setInterval(() => { if (i < stages.length - 1) setProcessingStage(stages[++i]) }, 8000)
    setProcessingStage(stages[0])

    try {
      const res = await fetch('/api/boq-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          dimensions: {
            totalFloorArea: parseInt(dims.totalFloorArea) || 1500,
            numberOfFloors: parseInt(dims.numberOfFloors),
            wallHeight: parseInt(dims.wallHeight),
            foundationType: dims.foundationType,
            roofType: dims.roofType,
            roofMaterial: dims.roofMaterial,
            numberOfDoors: parseInt(dims.numberOfDoors),
            numberOfWindows: parseInt(dims.numberOfWindows),
            numberOfSlidingDoors: parseInt(dims.numberOfSlidingDoors),
            numberOfBedrooms: parseInt(dims.numberOfBedrooms),
            numberOfBathrooms: parseInt(dims.numberOfBathrooms),
            hasGarage: dims.hasGarage,
            hasPool: dims.hasPool,
            hasGeneratorRoom: dims.hasGeneratorRoom,
            hasCoveredPatio: dims.hasCoveredPatio,
            patioArea: parseInt(dims.patioArea) || 0,
            island: dims.island,
            finishLevel: dims.finishLevel,
            specialRequirements: dims.specialRequirements,
          },
          projectName: `${dims.numberOfBedrooms} Bed / ${dims.numberOfBathrooms} Bath | ${dims.island}`,
        }),
      })
      const data = await res.json()
      clearInterval(interval)
      if (!res.ok) { setError(data.error || 'Generation failed'); setStep('dimensions'); return }
      setResult(data)
      setSelectedItems(new Set(data.lineItems.map((i: LineItem) => i.itemCode)))
      setStep('results')
    } catch (e) {
      clearInterval(interval)
      setError(e instanceof Error ? e.message : 'Generation failed')
      setStep('dimensions')
    } finally { setProcessing(false) }
  }

  async function buildShoppingList() {
    if (!result) return
    const items = result.lineItems.filter(i => selectedItems.has(i.itemCode))
    const res = await fetch('/api/shopping-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedItems: items }),
    })
    const data = await res.json()
    if (res.ok) setShoppingList(data.groupedBySupplier)
  }

  function inputStyle(): React.CSSProperties {
    return { background: 'var(--navy)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)', borderRadius: '2px', padding: '10px 12px', fontSize: '0.875rem', width: '100%' }
  }
  function labelStyle(): React.CSSProperties {
    return { display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="section-label mb-4">4-Layer BOQ Engine</div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Bill of Quantities Generator</h1>
        <p className="mb-10" style={{ color: 'var(--text-secondary)' }}>
          Dual AI validation — Claude Opus + GPT-4o — cross-checked against Bahamian construction formulas.
        </p>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-8">
            <div
              onDragOver={e => { e.preventDefault() }}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
              onClick={() => document.getElementById('boq-file')?.click()}
              className="cursor-pointer rounded-sm p-12 text-center"
              style={{ border: '2px dashed var(--cyan-border)', background: 'var(--navy-surface)' }}
            >
              {uploading ? (
                <><Loader2 size={36} className="animate-spin" style={{ color: 'var(--cyan)', margin: '0 auto 12px' }} /><p style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Uploading...</p></>
              ) : fileUrl ? (
                <><CheckCircle size={36} style={{ color: '#059669', margin: '0 auto 12px' }} /><p style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{file?.name}</p><p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4 }}>Click to replace</p></>
              ) : (
                <><Upload size={36} style={{ color: 'var(--cyan)', margin: '0 auto 12px', opacity: 0.7 }} /><p style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Drop your architectural plans (PDF)</p><p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4 }}>Optional — BOQ will use your confirmed dimensions if no plans provided</p></>
              )}
              <input id="boq-file" type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
            </div>

            {/* Why section */}
            <div className="rounded-sm p-4" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <button onClick={() => setShowWhySection(v => !v)} className="flex items-center justify-between w-full text-sm font-bold" style={{ color: 'var(--cyan)' }}>
                Why upload plans? {showWhySection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showWhySection && (
                <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  When you upload architectural drawings, our AI quantity surveyors can measure directly from your plans — giving you higher confidence quantities. Without plans, we calculate from your confirmed dimensions using Bahamian construction formulas. Both approaches work; plans give you more accurate results.
                </p>
              )}
            </div>

            {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}

            <button onClick={() => setStep('dimensions')} className="w-full py-4 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
              {fileUrl ? 'Continue with Plans →' : 'Continue Without Plans →'}
            </button>
          </div>
        )}

        {/* Step: Dimensions */}
        {step === 'dimensions' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label style={labelStyle()}>Total Floor Area (sqft) *</label>
                <input required type="number" placeholder="e.g. 1500" value={dims.totalFloorArea} onChange={e => setDims(p => ({ ...p, totalFloorArea: e.target.value }))} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Number of Floors</label>
                <select value={dims.numberOfFloors} onChange={e => setDims(p => ({ ...p, numberOfFloors: e.target.value }))} style={inputStyle()}>
                  {['1','2','3'].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle()}>Wall Height (ft)</label>
                <input type="number" value={dims.wallHeight} onChange={e => setDims(p => ({ ...p, wallHeight: e.target.value }))} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Foundation Type</label>
                <select value={dims.foundationType} onChange={e => setDims(p => ({ ...p, foundationType: e.target.value }))} style={inputStyle()}>
                  <option value="slab">Slab</option>
                  <option value="stem_wall">Stem Wall</option>
                  <option value="pile">Pile</option>
                  <option value="combined">Combined</option>
                </select>
              </div>
              <div>
                <label style={labelStyle()}>Roof Type</label>
                <select value={dims.roofType} onChange={e => setDims(p => ({ ...p, roofType: e.target.value }))} style={inputStyle()}>
                  <option value="hip">Hip</option>
                  <option value="gable">Gable</option>
                  <option value="flat">Flat</option>
                  <option value="combination">Combination</option>
                </select>
              </div>
              <div>
                <label style={labelStyle()}>Finish Level</label>
                <select value={dims.finishLevel} onChange={e => setDims(p => ({ ...p, finishLevel: e.target.value }))} style={inputStyle()}>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
              <div>
                <label style={labelStyle()}>Doors</label>
                <input type="number" value={dims.numberOfDoors} onChange={e => setDims(p => ({ ...p, numberOfDoors: e.target.value }))} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Windows</label>
                <input type="number" value={dims.numberOfWindows} onChange={e => setDims(p => ({ ...p, numberOfWindows: e.target.value }))} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Sliding Doors</label>
                <input type="number" value={dims.numberOfSlidingDoors} onChange={e => setDims(p => ({ ...p, numberOfSlidingDoors: e.target.value }))} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Bedrooms</label>
                <input type="number" value={dims.numberOfBedrooms} onChange={e => setDims(p => ({ ...p, numberOfBedrooms: e.target.value }))} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Bathrooms</label>
                <input type="number" value={dims.numberOfBathrooms} onChange={e => setDims(p => ({ ...p, numberOfBathrooms: e.target.value }))} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Island</label>
                <select value={dims.island} onChange={e => setDims(p => ({ ...p, island: e.target.value }))} style={inputStyle()}>
                  {ISLANDS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[['hasGarage','Garage'],['hasPool','Pool'],['hasGeneratorRoom','Generator Room'],['hasCoveredPatio','Covered Patio']].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm p-3 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={dims[key as keyof typeof dims] as boolean} onChange={e => setDims(p => ({ ...p, [key]: e.target.checked }))} />
                  {label}
                </label>
              ))}
            </div>

            <div>
              <label style={labelStyle()}>Special Requirements</label>
              <textarea rows={2} value={dims.specialRequirements} onChange={e => setDims(p => ({ ...p, specialRequirements: e.target.value }))} placeholder="e.g. Hurricane impact windows, solar panel prep, cistern..." style={{ ...inputStyle(), resize: 'none' }} />
            </div>

            {error && <div className="flex items-center gap-2 p-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}><AlertCircle size={16} style={{ color: '#ef4444' }} /><span className="text-sm" style={{ color: '#ef4444' }}>{error}</span></div>}

            <div className="flex gap-4">
              <button onClick={() => setStep('upload')} className="flex-1 py-3 rounded-sm font-bold text-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--text-secondary)' }}>← Back</button>
              <button onClick={handleGenerate} disabled={!dims.totalFloorArea} className="flex-1 py-4 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)', opacity: !dims.totalFloorArea ? 0.6 : 1 }}>
                Generate BOQ →
              </button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="text-center py-20">
            <Loader2 size={56} className="animate-spin mx-auto mb-6" style={{ color: 'var(--cyan)' }} />
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Running 4-Layer BOQ Engine</h2>
            <p className="text-sm mb-8" style={{ color: 'var(--cyan)' }}>{processingStage}</p>
            <div className="space-y-2 max-w-sm mx-auto text-left">
              {['Claude Opus Vision takeoff', 'GPT-4o cross-validation', 'Formula engine check', 'Confidence scoring', 'Island premium applied', 'PDF generation'].map((stage, i) => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                  <div className="w-4 h-4 rounded-full" style={{ background: 'var(--navy-card)', border: '1px solid var(--cyan-border)' }} />
                  {stage}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && result && (
          <div className="space-y-8">
            {/* Assessment + Confidence */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                <div className="section-label mb-2">Drawing Quality</div>
                <p className="text-3xl font-black" style={{ color: 'var(--cyan)' }}>{result.assessment.qualityScore}/5</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{result.assessment.recommendation.replace(/_/g, ' ')}</p>
              </div>
              <div className="p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                <div className="section-label mb-2">Overall Accuracy</div>
                <p className="text-3xl font-black" style={{ color: result.confidence.overallScore >= 85 ? '#059669' : result.confidence.overallScore >= 70 ? 'var(--amber)' : '#ef4444' }}>{result.confidence.overallScore}%</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{result.confidence.highPct}% high · {result.confidence.mediumPct}% med · {result.confidence.lowPct}% low</p>
              </div>
            </div>

            {/* Grand total */}
            <div className="p-6 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <div className="section-label mb-3">Estimated Project Cost</div>
              <p className="text-4xl font-black" style={{ color: 'var(--cyan)', letterSpacing: '-0.03em' }}>
                ${result.summary.grandTotalLow.toLocaleString()} – ${result.summary.grandTotalHigh.toLocaleString()}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {[['Materials', result.summary.materialsCostLow],['Labour (est.)', result.summary.labourEstimateLow],['Permits', result.summary.permitFees],['Contingency', result.summary.contingency]].map(([label, val]) => (
                  <div key={label as string}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>${(val as number).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trade summary */}
            <div>
              <div className="section-label mb-3">By Trade</div>
              <div className="space-y-2">
                {result.trades.map(t => (
                  <div key={t.trade} className="flex items-center justify-between p-3 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{t.trade}</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--cyan)' }}>${t.subtotalLow.toLocaleString()} – ${t.subtotalHigh.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="section-label">All Items ({result.lineItems.length})</div>
                <button onClick={() => setSelectedItems(selectedItems.size === result.lineItems.length ? new Set() : new Set(result.lineItems.map(i => i.itemCode)))} className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>
                  {selectedItems.size === result.lineItems.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {result.lineItems.map(item => (
                  <label key={item.itemCode} className="flex items-center justify-between p-2.5 rounded-sm cursor-pointer" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedItems.has(item.itemCode)} onChange={() => setSelectedItems(prev => { const s = new Set(prev); if (s.has(item.itemCode)) { s.delete(item.itemCode) } else { s.add(item.itemCode) } return s })} />
                      <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ background: item.confidence === 'high' ? 'rgba(5,150,105,0.2)' : item.confidence === 'medium' ? 'rgba(245,166,35,0.2)' : 'rgba(239,68,68,0.2)', color: item.confidence === 'high' ? '#059669' : item.confidence === 'medium' ? 'var(--amber)' : '#ef4444', fontSize: '0.65rem' }}>
                        {item.confidence}
                      </span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{item.quantity} {item.unit}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {result.reportUrl && (
                <a href={result.reportUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
                  <Download size={16} /> Download PDF Report
                </a>
              )}
              <button onClick={buildShoppingList} className="py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--amber)', color: '#1a0f00' }}>
                Build Shopping List ({selectedItems.size} items)
              </button>
              <Link href="/services" className="block text-center py-3 rounded-sm font-bold text-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--text-secondary)' }}>
                Get Hardware Store Quotes →
              </Link>
            </div>

            {/* Shopping list */}
            {shoppingList && (
              <div>
                <div className="section-label mb-3">Shopping List by Supplier</div>
                {shoppingList.map(group => (
                  <div key={group.supplier} className="mb-4 p-4 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{group.supplier}</p>
                      <p className="font-bold text-sm" style={{ color: 'var(--cyan)' }}>${group.subtotal.toLocaleString()}</p>
                    </div>
                    {group.items.map((item: LineItem) => (
                      <div key={item.itemCode} className="flex justify-between text-xs py-1" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid rgba(0,212,245,0.08)' }}>
                        <span>{item.description}</span>
                        <span>{item.quantity} × ${item.unitPrice?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
