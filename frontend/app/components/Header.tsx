'use client';

import { motion } from 'framer-motion';
import { Shield, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Shield className="w-8 h-8 text-emerald-600" strokeWidth={2} />
            <span className="text-2xl font-bold text-gray-900">TrustBridge</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isHomePage && (
              <>
                <a href="#features" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
                  Features
                </a>
                <a href="#how-it-works" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
                  How It Works
                </a>
              </>
            )}
            <Link href="/dashboard" className={`transition-colors font-medium ${pathname === '/dashboard' ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'}`}>
              Browse NGOs
            </Link>
            <Link href="/profile/create" className={`transition-colors font-medium ${pathname === '/profile/create' ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'}`}>
              Register NGO
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <appkit-button />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pt-4 pb-6 border-t border-gray-100 mt-4"
          >
            <div className="flex flex-col gap-4">
              {isHomePage && (
                <>
                  <a
                    href="#features"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-emerald-600 transition-colors font-medium py-2"
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-emerald-600 transition-colors font-medium py-2"
                  >
                    How It Works
                  </a>
                </>
              )}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`transition-colors font-medium py-2 ${pathname === '/dashboard' ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'}`}
              >
                Browse NGOs
              </Link>
              <Link
                href="/profile/create"
                onClick={() => setMobileMenuOpen(false)}
                className={`transition-colors font-medium py-2 ${pathname === '/profile/create' ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'}`}
              >
                Register NGO
              </Link>
              <div className="pt-4 border-t border-gray-100">
                <appkit-button />
              </div>
            </div>
          </motion.div>
        )}
      </nav>
    </motion.header>
  );
}