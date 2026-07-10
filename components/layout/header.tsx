"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import { Menu, X, HardHat } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary-700">
              <HardHat className="h-7 w-7" />
              <span>Groundwork BHS</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/post-project"
              className={`text-sm font-medium transition-colors ${
                isActive("/post-project")
                  ? "text-primary-600"
                  : "text-gray-700 hover:text-primary-600"
              }`}
            >
              Post a Project
            </Link>
            <Link
              href="/contractors"
              className={`text-sm font-medium transition-colors ${
                isActive("/contractors")
                  ? "text-primary-600"
                  : "text-gray-700 hover:text-primary-600"
              }`}
            >
              Find Contractors
            </Link>
            <Link
              href="/advisor"
              className={`text-sm font-medium transition-colors ${
                isActive("/advisor")
                  ? "text-primary-600"
                  : "text-gray-700 hover:text-primary-600"
              }`}
            >
              AI Advisor
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <SignInButton>
                  <button className="text-sm font-medium text-gray-700 hover:text-primary-600">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="btn-primary">
                    Get Started
                  </button>
                </SignUpButton>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-4">
            <Link
              href="/post-project"
              className="block text-sm font-medium text-gray-700 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Post a Project
            </Link>
            <Link
              href="/contractors"
              className="block text-sm font-medium text-gray-700 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find Contractors
            </Link>
            <Link
              href="/advisor"
              className="block text-sm font-medium text-gray-700 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              AI Advisor
            </Link>
            <div className="pt-4 border-t border-gray-200">
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="block text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <SignInButton>
                    <button className="block w-full text-left text-sm font-medium text-gray-700">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="btn-primary w-full mt-2">
                      Get Started
                    </button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
