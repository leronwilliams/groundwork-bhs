'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/guides', label: 'Guides' },
  { href: '/permits', label: 'Permits' },
  { href: '/property-tax', label: 'Property Tax' },
  { href: '/contractors', label: 'Contractors' },
  { href: '/services', label: 'Services' },
  { href: '/advisor', label: 'Advisor' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { isSignedIn } = useUser()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
      style={{
        background: scrolled ? 'rgba(6,13,26,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--cyan-border)' : '1px solid transparent',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-black"
            style={{ background: 'var(--cyan)', color: 'var(--navy)', letterSpacing: '-0.02em' }}
          >
            GW
          </div>
          <span className="text-xl font-black tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-bright)', letterSpacing: '-0.03em' }}>
            Groundwork
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium transition-colors hover:text-white"
              style={{ color: 'var(--text-secondary)', letterSpacing: '0.01em' }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-3">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-bold px-5 py-2 rounded-sm transition-all"
                style={{ border: '1.5px solid var(--cyan-border)', color: 'var(--cyan)' }}
              >
                Dashboard
              </Link>
              <SignOutButton>
                <button className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  Sign out
                </button>
              </SignOutButton>
            </>
          ) : (
            <>
              <Link href="/pricing" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Pricing
              </Link>
              <SignInButton mode="modal">
                <button
                  className="btn-glow text-sm font-bold px-5 py-2.5 rounded-sm transition-all"
                  style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
                >
                  Sign in
                </button>
              </SignInButton>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden"
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => setMenuOpen(o => !o)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-6 pt-2" style={{ background: 'rgba(6,13,26,0.97)', borderTop: '1px solid var(--cyan-border)' }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block py-3 text-base font-medium border-b"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--cyan-border)' }}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="mt-4">
            <Link href="/pricing" className="block py-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Pricing
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
