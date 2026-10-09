'use client'
import { CIRCLE_TRADES, SETTLEMENTS } from '@/lib/builders-circle/constants'
import { CheckboxGroup } from './CheckboxGroup'
import { fieldStyle } from './ui'

export type ProfileForm = {
  businessName: string; contactName: string; email: string; phone: string; whatsapp: string
  trades: string[]; serviceAreas: string[]; businessAddress: string; yearsInBusiness: string; description: string; website: string
}

const L = ({ children }: { children: React.ReactNode }) => <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>{children}</label>

export function ProfileFields({ form, set, lockBusinessName }: { form: ProfileForm; set: (p: Partial<ProfileForm>) => void; lockBusinessName?: boolean }) {
  const input = (k: keyof ProfileForm, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input value={form[k] as string} onChange={e => set({ [k]: e.target.value } as Partial<ProfileForm>)} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} name={k} {...props} />
  )
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><L>Registered business name</L>{input('businessName', { required: true, disabled: lockBusinessName, placeholder: 'e.g. TEST Freeport Masonry Ltd' })}</div>
        <div><L>Contact name</L>{input('contactName', { required: true })}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><L>Email</L>{input('email', { required: true, type: 'email' })}</div>
        <div><L>Phone</L>{input('phone', { required: true, placeholder: '242-___-____' })}</div>
        <div><L>WhatsApp (optional)</L>{input('whatsapp')}</div>
      </div>
      <div><L>Trades (choose all that apply)</L><CheckboxGroup name="trades" options={CIRCLE_TRADES} value={form.trades} onChange={v => set({ trades: v })} /></div>
      <div><L>Grand Bahama service areas</L><CheckboxGroup name="serviceAreas" options={SETTLEMENTS} value={form.serviceAreas} onChange={v => set({ serviceAreas: v })} /></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2"><L>Business address</L>{input('businessAddress', { required: true, placeholder: 'Street, settlement, Grand Bahama' })}</div>
        <div><L>Years in business</L>{input('yearsInBusiness', { type: 'number', min: 0, max: 149 })}</div>
      </div>
      <div><L>Website (optional)</L>{input('website', { placeholder: 'https://' })}</div>
      <div>
        <L>About your business (optional)</L>
        <textarea value={form.description} onChange={e => set({ description: e.target.value })} rows={4} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} name="description" />
      </div>
    </div>
  )
}
