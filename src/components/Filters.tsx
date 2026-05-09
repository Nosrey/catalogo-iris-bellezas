'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { Brand } from '@/lib/brands';
import { SortOption } from '@/lib/filters';

export interface FilterOptions {
  searchTerm: string;
  minPrice: number;
  maxPrice: number;
  selectedBrands: string[];
  sortBy: SortOption;
}

interface FiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableBrands: Brand[];
}

// Rangos de precios en bolívares (adaptados)
const priceRanges = [
  { min: 0, max: 500, label: 'Bs. 0 - 500' },
  { min: 500, max: 1000, label: 'Bs. 500 - 1.000' },
  { min: 1000, max: 2000, label: 'Bs. 1.000 - 2.000' },
  { min: 2000, max: 5000, label: 'Bs. 2.000 - 5.000' },
  { min: 5000, max: Infinity, label: 'Más de Bs. 5.000' }
];

export default function Filters({ filters, onFiltersChange, availableBrands }: FiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePriceRangeChange = (min: number, max: number) => {
    onFiltersChange({
      ...filters,
      minPrice: min,
      maxPrice: max
    });
  };

  const handleBrandToggle = (brandId: string) => {
    const newSelectedBrands = filters.selectedBrands.includes(brandId)
      ? filters.selectedBrands.filter(b => b !== brandId)
      : [...filters.selectedBrands, brandId];
    
    onFiltersChange({
      ...filters,
      selectedBrands: newSelectedBrands
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: filters.searchTerm,
      minPrice: 0,
      maxPrice: Infinity,
      selectedBrands: [],
      sortBy: 'default'
    });
  };

  const hasActiveFilters = filters.minPrice > 0 || filters.maxPrice < Infinity || filters.selectedBrands.length > 0 || filters.sortBy !== 'default';
  const activeFilterCount = filters.selectedBrands.length + ((filters.minPrice > 0 || filters.maxPrice < Infinity) ? 1 : 0) + (filters.sortBy !== 'default' ? 1 : 0);

  const handleSortChange = (sortBy: SortOption) => {
    onFiltersChange({
      ...filters,
      sortBy
    });
  };

  // Verificar si un rango de precios está activo
  const isPriceRangeActive = (min: number, max: number) => {
    return filters.minPrice === min && filters.maxPrice === max;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      {/* Mobile Toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Filtros</span>
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Filters Content */}
      <div className={`${isExpanded ? 'block' : 'hidden'} md:block p-4 space-y-6`}>
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtros</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Price Filter - Estilo Amazon */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 text-sm">Precio</h4>
          <div className="space-y-2">
            {priceRanges.map((range) => (
              <label
                key={`${range.min}-${range.max}`}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <input
                  type="radio"
                  name="priceRange"
                  checked={isPriceRangeActive(range.min, range.max)}
                  onChange={() => handlePriceRangeChange(range.min, range.max)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Brands Filter */}
        {availableBrands.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-sm">Marcas</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {availableBrands.map((brand) => (
                <label
                  key={brand.id}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.selectedBrands.includes(brand.id)}
                    onChange={() => handleBrandToggle(brand.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{brand.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-900 text-sm">Ordenar por</h4>
          </div>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
              <input
                type="radio"
                name="sortBy"
                value="default"
                checked={filters.sortBy === 'default'}
                onChange={() => handleSortChange('default')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Predeterminado</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
              <input
                type="radio"
                name="sortBy"
                value="name-asc"
                checked={filters.sortBy === 'name-asc'}
                onChange={() => handleSortChange('name-asc')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Nombre (A-Z)</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
              <input
                type="radio"
                name="sortBy"
                value="name-desc"
                checked={filters.sortBy === 'name-desc'}
                onChange={() => handleSortChange('name-desc')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Nombre (Z-A)</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
              <input
                type="radio"
                name="sortBy"
                value="popularity-desc"
                checked={filters.sortBy === 'popularity-desc'}
                onChange={() => handleSortChange('popularity-desc')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Más populares</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
              <input
                type="radio"
                name="sortBy"
                value="popularity-asc"
                checked={filters.sortBy === 'popularity-asc'}
                onChange={() => handleSortChange('popularity-asc')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Menos populares</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
              <input
                type="radio"
                name="sortBy"
                value="price-asc"
                checked={filters.sortBy === 'price-asc'}
                onChange={() => handleSortChange('price-asc')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Precio (menor a mayor)</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
              <input
                type="radio"
                name="sortBy"
                value="price-desc"
                checked={filters.sortBy === 'price-desc'}
                onChange={() => handleSortChange('price-desc')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Precio (mayor a menor)</span>
            </label>
          </div>
        </div>

        {/* Mobile Clear Button */}
        <div className="md:hidden pt-4 border-t border-gray-200">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
