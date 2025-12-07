'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

interface FilterSidebarProps {
  onSearchChange: (search: string) => void;
  onCountryChange: (country: string) => void;
  onSortChange: (sort: string) => void;
}

const countries = [
  { code: 'all', name: 'All Countries', flag: '🌍' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'donations-high', label: 'Highest Donations' },
  { value: 'donations-low', label: 'Lowest Donations' },
  { value: 'donors-high', label: 'Most Donors' },
];

export default function FilterSidebar({ onSearchChange, onCountryChange, onSortChange }: FilterSidebarProps) {
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    onCountryChange(country);
  };

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
    onSortChange(sort);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Search NGOs
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name or mission..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Sort By
        </label>
        <select
          value={selectedSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Country Filter */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Filter by Country
        </label>
        <div className="space-y-2">
          {countries.map((country) => (
            <button
              key={country.code}
              onClick={() => handleCountryChange(country.code)}
              className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
                selectedCountry === country.code
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">{country.flag}</span>
                <span className="font-medium">{country.name}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}