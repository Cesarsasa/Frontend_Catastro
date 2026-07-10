import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Buscar...' }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7fa5]" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#d0e8f5] rounded-lg bg-white text-[#0d2137] placeholder-[#8ab4cc] focus:outline-none focus:ring-2 focus:ring-[#1e6b9e]/30 focus:border-[#1e6b9e] transition-all duration-200"
      />
    </div>
  );
}