'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, MapPin, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { NGO } from '../data/mockNGOs';

interface NGOCardProps {
  ngo: NGO;
  index?: number;
}

const countryFlags: Record<string, string> = {
  KE: '🇰🇪',
  NG: '🇳🇬',
  GH: '🇬🇭',
  ZA: '🇿🇦',
  UG: '🇺🇬',
  TZ: '🇹🇿',
};

export default function NGOCard({ ngo, index = 0 }: NGOCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/ngo/${ngo.id}`}>
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden h-full cursor-pointer">
          {/* Logo */}
          <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-blue-100 overflow-hidden">
            <img
              src={ngo.logo}
              alt={ngo.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {ngo.verified && (
              <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-medium shadow-lg">
                <CheckCircle2 className="w-4 h-4" />
                Verified
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                {ngo.name}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <MapPin className="w-4 h-4" />
              <span className="flex items-center gap-1">
                <span className="text-lg">{countryFlags[ngo.countryCode]}</span>
                {ngo.country}
              </span>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
              {ngo.mission}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-sm">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-gray-900">
                  ${ngo.totalDonations.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-gray-900">
                  {ngo.donorCount} donors
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}