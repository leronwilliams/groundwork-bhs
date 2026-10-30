// Builders Circle pages get their own orange / black / white theme.
// Styles live in app/globals.css under .bc-theme / .bc-light / .bc-dark and only
// apply when this wrapper is on the page.
import { PwaRegister } from '@/components/builders-circle/PwaRegister'

export default function BuildersCircleLayout({ children }: { children: React.ReactNode }) {
  return <div className="bc-theme"><PwaRegister />{children}</div>
}
