'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { isSignedIn } = useUser()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(10,22,40,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--cyan-border)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
          >
            GW
          </div>
          <span className="text-lg font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
            Groundwork
          </span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { href: '/guides', label: 'Guides' },
            { href: '/permits', label: 'Permits' },
            { href: '/property-tax', label: 'Property Tax' },
            { href: '/contractors', label: 'Contractors' },
            { href: '/advisor', label: 'Advisor' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm transition-colors"
              style={{ color: 'var(--muted)' }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--text)' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--muted)' }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm px-4 py-1.5 rounded-sm transition-all"
                style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }}
              >
                Dashboard
              </Link>
              <SignOutButton>
                <button className="text-sm" style={{ color: 'var(--muted)' }}>
                  Sign out
                </button>
              </SignOutButton>
            </>
          ) : (
            <SignInButton mode="modal">
              <button
                className="text-sm px-4 py-1.5 rounded-sm transition-all"
                style={{ background: 'var(--cyan)', color: 'var(--navy)', fontWeight: 600 }}
              >
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  )
}
