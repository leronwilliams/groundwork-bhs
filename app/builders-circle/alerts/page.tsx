import Link from 'next/link'
import { Bell, Smartphone, Share, PlusSquare, CheckCircle2, Volume2 } from 'lucide-react'
import { pageMeta } from '@/lib/seo'
import { getCircleContext } from '@/lib/builders-circle/server'
import { vapidPublicKey } from '@/lib/builders-circle/push'
import { BuildersCircleLogo, MemberShell, cardStyle } from '@/components/builders-circle/ui'
import { JobAlerts } from '@/components/builders-circle/JobAlerts'

export const metadata = pageMeta('/builders-circle/alerts', 'Job alerts and install the app', 'Install Groundwork on your phone and get an alert when a new Grand Bahama job or tender is posted.', { noindex: true })
export const dynamic = 'force-dynamic'

const step = (n: number, icon: React.ReactNode, title: string, text: React.ReactNode) => (
  <li className="flex gap-4 items-start">
    <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#ea580c', color: '#fff' }}>{n}</span>
    <div><p className="font-bold text-sm mb-1 inline-flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>{icon}{title}</p><p className="text-sm">{text}</p></div>
  </li>
)

export default async function AlertsPage() {
  const ctx = await getCircleContext()
  const member = ctx.member
  const canSubscribe = !!member || ctx.admin
  const full = !!member && member.status !== 'suspended' && member.status !== 'rejected'

  const body = (
    <div className="space-y-8 max-w-3xl">
      <div className="p-6 rounded-sm" style={cardStyle}>
        <h2 className="mb-2" style={{ fontSize: '1.3rem' }}>Get an alert when a new job is posted</h2>
        <p className="text-sm mb-5">When a new Grand Bahama tender, job or news item goes on the board, we can send an alert straight to your phone. You only get alerts for the areas you serve (Grand Bahama, and Nassau if you list it), and only once your business is verified. You can turn it off any time.</p>
        <JobAlerts publicKey={vapidPublicKey()} signedIn={!!ctx.userId} canSubscribe={canSubscribe} />
        {member && member.status !== 'verified' && <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>Your membership is not verified yet. You can turn alerts on now; they start once we verify your business.</p>}
      </div>

      <div className="p-6 rounded-sm" style={cardStyle}>
        <h2 className="mb-1 inline-flex items-center gap-2" style={{ fontSize: '1.2rem' }}><Smartphone size={18} /> iPhone and iPad</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>Needs iOS or iPadOS 16.4 or newer. Alerts on iPhone only work from the Home Screen app, not from a Safari tab.</p>
        <ol className="space-y-4">
          {step(1, <Share size={15} />, 'Open this page in Safari', 'Go to groundworksbhs.com/builders-circle/alerts and sign in. It must be Safari, not another browser inside an app.')}
          {step(2, <Share size={15} />, 'Tap Share, then Add to Home Screen', 'Tap the Share button (square with an arrow) at the bottom of Safari. Scroll down, tap “Add to Home Screen”, then tap Add.')}
          {step(3, <PlusSquare size={15} />, 'Open Groundwork from your Home Screen', 'Use the new Groundwork icon, not Safari. Sign in again if asked.')}
          {step(4, <Bell size={15} />, 'Tap “Turn on job alerts” and choose Allow', 'iPhone will ask if Groundwork can send notifications. Tap Allow. Then tap “Send me a test alert” to check it works.')}
        </ol>
      </div>

      <div className="p-6 rounded-sm" style={cardStyle}>
        <h2 className="mb-1 inline-flex items-center gap-2" style={{ fontSize: '1.2rem' }}><Smartphone size={18} /> Android</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>Works in Chrome. Installing the app is optional but recommended.</p>
        <ol className="space-y-4">
          {step(1, <Bell size={15} />, 'Open this page in Chrome and sign in', 'Tap “Turn on job alerts” and choose Allow when Chrome asks.')}
          {step(2, <PlusSquare size={15} />, 'Install the app (optional)', 'Tap the Chrome menu (three dots), then “Install app” or “Add to Home screen”. Groundwork appears on your home screen like any app.')}
          {step(3, <CheckCircle2 size={15} />, 'Send yourself a test alert', 'Tap “Send me a test alert”. It should arrive within a few seconds.')}
        </ol>
      </div>

      <div className="p-6 rounded-sm" style={cardStyle}>
        <h2 className="mb-3 inline-flex items-center gap-2" style={{ fontSize: '1.2rem' }}><Volume2 size={18} /> What to expect, honestly</h2>
        <ul className="text-sm space-y-2 list-disc pl-5">
          <li>Alerts use your phone&apos;s normal notification sound and vibration. They do not ring like a phone call, and we cannot choose a custom ringtone.</li>
          <li><strong>Android:</strong> a sound and vibration play unless your phone is on silent or Do Not Disturb. You can change the sound in Settings, then Apps, then Chrome or Groundwork, then Notifications.</li>
          <li><strong>iPhone:</strong> you get the standard alert sound if your phone is not on silent or in a Focus mode. We cannot control vibration on iPhone.</li>
          <li>If you turn off notifications in your phone settings, or remove the app, alerts stop. Open this page again to turn them back on.</li>
        </ul>
      </div>
    </div>
  )

  if (full) return <MemberShell active="/builders-circle/board" title="Job alerts" status={member!.status}>{body}</MemberShell>
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bc-dark bc-hero pt-28 pb-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-5">
          <Link href="/builders-circle" className="shrink-0"><BuildersCircleLogo size={88} priority className="w-16 md:w-[88px]" sizes="(min-width: 768px) 88px, 64px" /></Link>
          <div>
            <div className="section-label mb-2" style={{ color: 'var(--amber)' }}>Builders Circle · Grand Bahama</div>
            <h1 className="font-black" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)' }}>Job alerts</h1>
            <p className="mt-2 text-sm">Install Groundwork on your phone and get an alert for new Grand Bahama work.</p>
          </div>
        </div>
      </div>
      <div className="bc-light flex-1 pt-10 pb-20 px-6"><div className="max-w-5xl mx-auto">{body}</div></div>
    </div>
  )
}
