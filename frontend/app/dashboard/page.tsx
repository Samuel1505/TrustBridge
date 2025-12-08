'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import NGOCard from '../components/NGOCard';
import FilterSidebar from '../components/FilterSidebar';
import { mockNGOs } from '../data/mockNGOs';

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');

  const filteredAndSortedNGOs = useMemo(() => {
    let filtered = mockNGOs;

    // Filter by search
    if (search) {
      filtered = filtered.filter(
        (ngo) =>
          ngo.name.toLowerCase().includes(search.toLowerCase()) ||
          ngo.mission.toLowerCase().includes(search.toLowerCase()) ||
          ngo.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by country
    if (selectedCountry !== 'all') {
      filtered = filtered.filter((ngo) => ngo.countryCode === selectedCountry);
    }

    // Sort
    const sorted = [...filtered];
    switch (selectedSort) {
      case 'donations-high':
        sorted.sort((a, b) => b.totalDonations - a.totalDonations);
        break;
      case 'donations-low':
        sorted.sort((a, b) => a.totalDonations - b.totalDonations);
        break;
      case 'donors-high':
        sorted.sort((a, b) => b.donorCount - a.donorCount);
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.verificationDate).getTime() - new Date(a.verificationDate).getTime());
        break;
    }

    return sorted;
  }, [search, selectedCountry, selectedSort]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Browse NGOs</h1>
                <p className="text-gray-600 mt-1">
                  {filteredAndSortedNGOs.length} verified organizations
                </p>
              </div>
            </div>
            <appkit-button />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <FilterSidebar
                onSearchChange={setSearch}
                onCountryChange={setSelectedCountry}
                onSortChange={setSelectedSort}
              />
            </div>
          </div>

          {/* NGO Grid */}
          <div className="lg:col-span-3">
            {filteredAndSortedNGOs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
              >
                <p className="text-xl text-gray-600">No NGOs found matching your criteria</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredAndSortedNGOs.map((ngo, index) => (
                  <NGOCard key={ngo.id} ngo={ngo} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}