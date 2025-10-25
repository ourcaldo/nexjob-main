import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHoveredIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHoveredIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHoveredIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (hoveredIndex >= 0 && filteredOptions[hoveredIndex]) {
          onChange(filteredOptions[hoveredIndex].value);
          setIsOpen(false);
          setSearchTerm('');
          setHoveredIndex(-1);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHoveredIndex(-1);
        break;
    }
  };

  const handleOptionClick = (optionValue: string) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setHoveredIndex(-1);
  };

  const handleToggleClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`relative ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={handleToggleClick}
      >
        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <div className={`w-full pl-12 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none bg-white text-gray-900 flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
        }`}>
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''} ${
          disabled ? 'opacity-50' : ''
        }`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Cari provinsi..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHoveredIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {/* All option */}
            <div
              className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                value === '' 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-900 hover:bg-blue-50'
              }`}
              onClick={() => handleOptionClick('')}
              style={{ 
                backgroundColor: value === '' ? undefined : (hoveredIndex === -1 ? undefined : '#EBF5FA')
              }}
            >
              <MapPin className="h-4 w-4 mr-3 text-gray-400" />
              <span className="text-gray-900">Semua Provinsi</span>
            </div>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                    value === option.value 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-900'
                  }`}
                  style={{ 
                    backgroundColor: value === option.value 
                      ? undefined 
                      : (hoveredIndex === index ? '#EBF5FA' : undefined)
                  }}
                  onClick={() => handleOptionClick(option.value)}
                  onMouseEnter={() => setHoveredIndex(index)}
                >
                  <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                  <span className="text-gray-900">{option.label}</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm">
                Tidak ada provinsi ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;