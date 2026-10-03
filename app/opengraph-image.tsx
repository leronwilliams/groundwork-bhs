import { ImageResponse } from 'next/og'

export const alt = 'Groundwork BHS — Build right in The Bahamas'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '72px 80px', background: '#060d1a', color: '#f1f5f9', fontFamily: 'sans-serif',
          backgroundImage: 'linear-gradient(rgba(0,212,245,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,245,0.07) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, background: '#00d4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#060d1a', fontSize: 40, fontWeight: 900 }}>G</div>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>Groundwork <span style={{ color: '#00d4f5', marginLeft: 12 }}>BHS</span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2 }}>Build Right.</div>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2, color: '#00d4f5' }}>From the Ground Up.</div>
          <div style={{ fontSize: 30, marginTop: 28, color: '#94a3b8' }}>Permits · Cost estimates &amp; BOQs · Duty exemptions · Contractors</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: '#f5a623' }}>
          <span>Nassau &amp; the Family Islands</span>
          <span style={{ color: '#94a3b8' }}>groundworksbhs.com</span>
        </div>
      </div>
    ),
    size,
  )
}
