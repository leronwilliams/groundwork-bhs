'use client'

import { ReactNode, useEffect, useRef } from 'react'

interface VideoHeroProps {
  videoSrc?: string
  fallbackImage?: string
  children: ReactNode
  className?: string
}

export function VideoHero({ videoSrc, fallbackImage, children, className = '' }: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [])

  return (
    <div className={`relative min-h-screen flex flex-col justify-center overflow-hidden ${className}`}>
      {/* Video or fallback */}
      {videoSrc ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={fallbackImage}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : fallbackImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: 'var(--navy)' }} />
      )}

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,22,40,0.4) 0%, rgba(10,22,40,0.7) 40%, rgba(10,22,40,0.95) 100%)',
        }}
      />

      {/* Blueprint grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col">{children}</div>
    </div>
  )
}
