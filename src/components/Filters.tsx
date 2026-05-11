'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, ArrowUpDown, DollarSign, Tag, SlidersHorizontal, Check } from 'lucide-react';
import { Brand } from '@/lib/brands';
import { SortOption, generateDynamicPriceRanges, PriceRange } from '@/lib/filters';
import { Product } from '@/types/product';

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
  products: Product[];
}

type SectionType = 'price' | 'brands' | 'sort' | null;

export default function Filters({ filters, onFiltersChange, availableBrands, products }: FiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openSection, setOpenSection] = useState<SectionType>('price'); // Por defecto abrir Precio

  // Generar rangos de precio dinámicos basados en los productos
  const priceRanges = generateDynamicPriceRanges(products);

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

  const clearSection = (section: 'price' | 'brands' | 'sort') => {
    if (section === 'price') {
      onFiltersChange({ ...filters, minPrice: 0, maxPrice: Infinity });
    } else if (section === 'brands') {
      onFiltersChange({ ...filters, selectedBrands: [] });
    } else if (section === 'sort') {
      onFiltersChange({ ...filters, sortBy: 'default' });
    }
  };

  const hasActiveFilters = filters.minPrice > 0 || filters.maxPrice < Infinity || filters.selectedBrands.length > 0 || filters.sortBy !== 'default';

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.minPrice > 0 || filters.maxPrice < Infinity) count++;
    count += filters.selectedBrands.length;
    if (filters.sortBy !== 'default') count++;
    return count;
  };

  const handleSortChange = (sortBy: SortOption) => {
    onFiltersChange({
      ...filters,
      sortBy
    });
  };

  const isPriceRangeActive = (min: number, max: number) => {
    return filters.minPrice === min && filters.maxPrice === max;
  };

  const toggleSection = (section: SectionType) => {
    setOpenSection(openSection === section ? null : section);
  };

  const getSortLabel = (sortBy: SortOption): string => {
    const labels: Record<SortOption, string> = {
      'default': 'Novedades',
      'name-asc': 'Nombre A-Z',
      'name-desc': 'Nombre Z-A',
      'popularity-desc': 'Más vendidos',
      'popularity-asc': 'Menos vendidos',
      'price-asc': 'Precio: menor a mayor',
      'price-desc': 'Precio: mayor a menor'
    };
    return labels[sortBy];
  };

  const SectionHeader = ({
    section,
    icon: Icon,
    title,
    isActive,
    hasSelection,
    selectionText
  }: {
    section: SectionType;
    icon: React.ElementType;
    title: string;
    isActive: boolean;
    hasSelection: boolean;
    selectionText?: string;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
        isActive
          ? 'bg-rose-50 border-rose-200'
          : 'bg-gray-50 hover:bg-gray-100 border-transparent'
      } border`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-rose-100 text-rose-600' : 'bg-white text-gray-500'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-left">
          <span className={`font-medium text-sm ${isActive ? 'text-rose-700' : 'text-gray-700'}`}>
            {title}
          </span>
          {hasSelection && selectionText && (
            <p className="text-xs text-gray-500 mt-0.5">{selectionText}</p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {hasSelection && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              clearSection(section as 'price' | 'brands' | 'sort');
            }}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                clearSection(section as 'price' | 'brands' | 'sort');
              }
            }}
          >
            <X className="w-3 h-3 text-gray-400" />
          </span>
        )}
        {openSection === section ? (
          <ChevronUp className={`w-4 h-4 ${isActive ? 'text-rose-500' : 'text-gray-400'}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${isActive ? 'text-rose-500' : 'text-gray-400'}`} />
        )}
      </div>
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header con contador de filtros activos */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-100 rounded-lg">
              <SlidersHorizontal className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Filtros</h3>
              {getActiveFiltersCount() > 0 && (
                <p className="text-xs text-gray-500">{getActiveFiltersCount()} activo{getActiveFiltersCount() !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-colors"
            >
              Limpiar todo
            </button>
          )}
        </div>
      </div>

      {/* Mobile Toggle */}
      <div className="md:hidden border-b border-gray-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Mostrar filtros</span>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {getActiveFiltersCount()}
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
      <div className={`${isExpanded ? 'block' : 'hidden'} md:block p-3 space-y-2`}>
        {/* SECCIÓN: ORDENAR */}
        <div className="space-y-2">
          <SectionHeader
            section="sort"
            icon={ArrowUpDown}
            title="Ordenar por"
            isActive={openSection === 'sort'}
            hasSelection={filters.sortBy !== 'default'}
            selectionText={filters.sortBy !== 'default' ? getSortLabel(filters.sortBy) : undefined}
          />

          {openSection === 'sort' && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
              {[
                { value: 'default', label: 'Novedades', desc: 'Productos más recientes' },
                { value: 'popularity-desc', label: 'Más vendidos', desc: 'Más populares primero' },
                { value: 'name-asc', label: 'Nombre A-Z', desc: 'Orden alfabético' },
                { value: 'name-desc', label: 'Nombre Z-A', desc: 'Orden inverso' },
                { value: 'price-asc', label: 'Precio ↑', desc: 'Menor a mayor' },
                { value: 'price-desc', label: 'Precio ↓', desc: 'Mayor a menor' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                    filters.sortBy === option.value
                      ? 'bg-white border-rose-200 shadow-sm border'
                      : 'hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="sortBy"
                      value={option.value}
                      checked={filters.sortBy === option.value}
                      onChange={() => handleSortChange(option.value as SortOption)}
                      className="w-4 h-4 text-rose-600 border-gray-300 focus:ring-rose-500"
                    />
                    <div>
                      <span className={`text-sm font-medium ${filters.sortBy === option.value ? 'text-rose-700' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                      <p className="text-xs text-gray-400">{option.desc}</p>
                    </div>
                  </div>
                  {filters.sortBy === option.value && (
                    <Check className="w-4 h-4 text-rose-500" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* SECCIÓN: PRECIO */}
        <div className="space-y-2">
          <SectionHeader
            section="price"
            icon={DollarSign}
            title="Rango de Precio"
            isActive={openSection === 'price'}
            hasSelection={filters.minPrice > 0 || filters.maxPrice < Infinity}
            selectionText={
              filters.minPrice > 0 || filters.maxPrice < Infinity
                ? priceRanges.find(r => r.min === filters.minPrice && r.max === filters.maxPrice)?.label
                : undefined
            }
          />

          {openSection === 'price' && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
              {/* Opción para no filtrar por precio */}
              <label
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                  filters.minPrice === 0 && filters.maxPrice === Infinity
                    ? 'bg-white border-rose-200 shadow-sm border'
                    : 'hover:bg-white/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={filters.minPrice === 0 && filters.maxPrice === Infinity}
                    onChange={() => handlePriceRangeChange(0, Infinity)}
                    className="w-4 h-4 text-rose-600 border-gray-300 focus:ring-rose-500"
                  />
                  <span className={`text-sm ${filters.minPrice === 0 && filters.maxPrice === Infinity ? 'text-rose-700 font-medium' : 'text-gray-700'}`}>
                    Cualquier precio
                  </span>
                </div>
                <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full">
                  {products.length}
                </span>
              </label>

              <div className="border-t border-gray-200 my-2" />

              {priceRanges.map((range: PriceRange) => (
                <label
                  key={`${range.min}-${range.max}`}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                    isPriceRangeActive(range.min, range.max)
                      ? 'bg-white border-rose-200 shadow-sm border'
                      : 'hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={isPriceRangeActive(range.min, range.max)}
                      onChange={() => handlePriceRangeChange(range.min, range.max)}
                      className="w-4 h-4 text-rose-600 border-gray-300 focus:ring-rose-500"
                    />
                    <span className={`text-sm ${isPriceRangeActive(range.min, range.max) ? 'text-rose-700 font-medium' : 'text-gray-700'}`}>
                      {range.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full">
                    {range.count}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* SECCIÓN: MARCAS */}
        {availableBrands.length > 0 && (
          <div className="space-y-2">
            <SectionHeader
              section="brands"
              icon={Tag}
              title="Marcas"
              isActive={openSection === 'brands'}
              hasSelection={filters.selectedBrands.length > 0}
              selectionText={
                filters.selectedBrands.length > 0
                  ? `${filters.selectedBrands.length} seleccionada${filters.selectedBrands.length !== 1 ? 's' : ''}`
                  : undefined
              }
            />

            {openSection === 'brands' && (
              <div className="bg-gray-50 rounded-lg p-3 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {availableBrands.map((brand) => (
                    <label
                      key={brand.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                        filters.selectedBrands.includes(brand.id)
                          ? 'bg-white border-rose-200 shadow-sm border'
                          : 'hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={filters.selectedBrands.includes(brand.id)}
                          onChange={() => handleBrandToggle(brand.id)}
                          className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                        />
                        <span className={`text-sm ${filters.selectedBrands.includes(brand.id) ? 'text-rose-700 font-medium' : 'text-gray-700'}`}>
                          {brand.name}
                        </span>
                      </div>
                      {filters.selectedBrands.includes(brand.id) && (
                        <Check className="w-4 h-4 text-rose-500" />
                      )}
                    </label>
                  ))}
                </div>

                {filters.selectedBrands.length > 0 && (
                  <button
                    onClick={() => clearSection('brands')}
                    className="w-full mt-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    Limpiar selección
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Clear Button */}
        <div className="md:hidden pt-3 border-t border-gray-100">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium"
            >
              <X className="w-4 h-4" />
              <span>Limpiar todos los filtros</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
