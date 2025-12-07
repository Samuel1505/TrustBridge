'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function Header() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-emerald-600" strokeWidth={2} />
          <span className="text-2xl font-bold text-gray-900">TrustBridge</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
            How It Works
          </a>
          <a href="#browse" className="text-gray-600 hover:text-gray-900 transition-colors">
            Browse NGOs
          </a>
        </div>

        <div className="flex items-center gap-4">
          <button className="px-6 py-2.5 text-emerald-600 font-medium hover:bg-emerald-50 rounded-full transition-colors">
            Register NGO
          </button>
        </div>
      </nav>
    </motion.header>
  );
}