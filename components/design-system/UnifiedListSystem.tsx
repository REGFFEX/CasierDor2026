/**
 * Unified List System - CASIER D'OR
 * 
 * Système unifié de vues, recherche, filtres et actions pour tous les modules
 * Mobile-first, responsive, réutilisable
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Grid3x3, List, LayoutGrid, MoreVertical, X, Check, ChevronDown } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type ViewMode = 'list' | 'grid' | 'cards';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface SortOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface ViewConfig {
  availableViews: ViewMode[];
  defaultView: ViewMode;
  searchableFields: string[];
  filters: FilterOption[];
  sortOptions: SortOption[];
  multiSelectFilters?: boolean;
}

export interface ListState {
  viewMode: ViewMode;
  searchQuery: string;
  activeFilters: string[];
  sortBy: string;
  selectedItems: Set<string>;
}

export interface UnifiedListProps<T> {
  // Data
  items: T[];
  viewConfig: ViewConfig;
  
  // Rendering
  renderItem: (item: T, viewMode: ViewMode) => React.ReactNode;
  renderCardActions?: (item: T) => React.ReactNode;
  
  // Callbacks
  onItemClick?: (item: T) => void;
  onItemSelect?: (item: T, selected: boolean) => void;
  onMultiSelectAction?: (selectedItems: T[]) => void;
  
  // Customization
  primaryAction?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
  
  // Persistence
  storageKey?: string;
  className?: string;
}

// ============================================================================
// HOOKS
// ============================================================================

export function useUnifiedListState<T>(
  items: T[],
  viewConfig: ViewConfig,
  storageKey?: string
) {
  // Load persisted state
  const loadState = useCallback((): ListState => {
    if (!storageKey) {
      return {
        viewMode: viewConfig.defaultView,
        searchQuery: '',
        activeFilters: [],
        sortBy: viewConfig.sortOptions[0]?.id || '',
        selectedItems: new Set(),
      };
    }
    
    try {
      const saved = localStorage.getItem(`unified_list_${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          selectedItems: new Set(parsed.selectedItems || []),
        };
      }
    } catch (e) {
      console.warn('Failed to load list state:', e);
    }
    
    return {
      viewMode: viewConfig.defaultView,
      searchQuery: '',
      activeFilters: [],
      sortBy: viewConfig.sortOptions[0]?.id || '',
      selectedItems: new Set(),
    };
  }, [viewConfig, storageKey]);

  const [state, setState] = useState<ListState>(loadState);

  // Persist state changes
  useEffect(() => {
    if (!storageKey) return;
    
    const toSave = {
      ...state,
      selectedItems: Array.from(state.selectedItems),
    };
    localStorage.setItem(`unified_list_${storageKey}`, JSON.stringify(toSave));
  }, [state, storageKey]);

  // Actions
  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setActiveFilters = useCallback((filters: string[]) => {
    setState(prev => ({ ...prev, activeFilters: filters }));
  }, []);

  const setSortBy = useCallback((sort: string) => {
    setState(prev => ({ ...prev, sortBy: sort }));
  }, []);

  const toggleItemSelection = useCallback((itemId: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedItems);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      return { ...prev, selectedItems: newSelected };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedItems: new Set() }));
  }, []);

  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      activeFilters: [],
    }));
  }, []);

  return {
    state,
    setViewMode,
    setSearchQuery,
    setActiveFilters,
    setSortBy,
    toggleItemSelection,
    clearSelection,
    resetFilters,
  };
}

// ============================================================================
// SEARCH UTILITY
// ============================================================================

export function searchItems<T>(
  items: T[],
  query: string,
  fields: string[]
): T[] {
  if (!query.trim()) return items;
  
  const lowerQuery = query.toLowerCase();
  
  return items.filter(item => {
    return fields.some(field => {
      const value = (item as any)[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerQuery);
      }
      if (typeof value === 'number') {
        return value.toString().includes(lowerQuery);
      }
      return false;
    });
  });
}

// ============================================================================
// FILTER UTILITY
// ============================================================================

export function filterItems<T>(
  items: T[],
  activeFilters: string[],
  filterField: string
): T[] {
  if (activeFilters.length === 0) return items;
  
  return items.filter(item => {
    const value = (item as any)[filterField];
    return activeFilters.includes(value);
  });
}

// ============================================================================
// SORT UTILITY
// ============================================================================

export function sortItems<T>(
  items: T[],
  sortBy: string,
  sortOptions: SortOption[]
): T[] {
  const sortOption = sortOptions.find(opt => opt.id === sortBy);
  if (!sortOption) return items;
  
  return [...items].sort((a, b) => {
    // Default implementation - can be customized per module
    switch (sortBy) {
      case 'recent':
        return ((b as any).createdAt || 0) - ((a as any).createdAt || 0);
      case 'oldest':
        return ((a as any).createdAt || 0) - ((b as any).createdAt || 0);
      case 'name_asc':
        return ((a as any).name || '').localeCompare((b as any).name || '');
      case 'name_desc':
        return ((b as any).name || '').localeCompare((a as any).name || '');
      case 'amount_desc':
        return ((b as any).amount || 0) - ((a as any).amount || 0);
      case 'amount_asc':
        return ((a as any).amount || 0) - ((b as any).amount || 0);
      default:
        return 0;
    }
  });
}

// ============================================================================
// HIGHLIGHT TEXT UTILITY
// ============================================================================

export function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UnifiedList<T>({
  items,
  viewConfig,
  renderItem,
  renderCardActions,
  onItemClick,
  onItemSelect,
  onMultiSelectAction,
  primaryAction,
  storageKey,
  className = '',
}: UnifiedListProps<T>) {
  const {
    state,
    setViewMode,
    setSearchQuery,
    setActiveFilters,
    setSortBy,
    toggleItemSelection,
    clearSelection,
    resetFilters,
  } = useUnifiedListState(items, viewConfig, storageKey);

  // Apply search, filters, and sort
  const processedItems = useMemo(() => {
    let result = items;
    
    // Search
    result = searchItems(result, state.searchQuery, viewConfig.searchableFields);
    
    // Filters (assuming filter field is 'type' for now - can be customized)
    if (state.activeFilters.length > 0) {
      result = filterItems(result, state.activeFilters, 'type');
    }
    
    // Sort
    result = sortItems(result, state.sortBy, viewConfig.sortOptions);
    
    return result;
  }, [items, state.searchQuery, state.activeFilters, state.sortBy, viewConfig]);

  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  const hasActiveFilters = state.activeFilters.length > 0 || state.searchQuery.trim() !== '';

  return (
    <div className={`unified-list-system ${className}`}>
      {/* Compact Toolbar */}
      <div className="unified-toolbar">
        {/* Search */}
        <div className="unified-search">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={state.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="unified-search-input"
          />
          {state.searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="unified-search-clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="unified-actions">
          {/* View Toggle */}
          {viewConfig.availableViews.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowViewMenu(!showViewMenu)}
                className="unified-action-btn"
                title="Mode d'affichage"
              >
                {state.viewMode === 'list' && <List className="w-4 h-4" />}
                {state.viewMode === 'grid' && <Grid3x3 className="w-4 h-4" />}
                {state.viewMode === 'cards' && <LayoutGrid className="w-4 h-4" />}
              </button>
              
              {showViewMenu && (
                <ViewMenu
                  availableViews={viewConfig.availableViews}
                  currentView={state.viewMode}
                  onViewSelect={(mode) => {
                    setViewMode(mode);
                    setShowViewMenu(false);
                  }}
                  onClose={() => setShowViewMenu(false)}
                />
              )}
            </div>
          )}

          {/* Filters */}
          {viewConfig.filters.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`unified-action-btn ${state.activeFilters.length > 0 ? 'active' : ''}`}
              title="Filtres"
            >
              <Filter className="w-4 h-4" />
              {state.activeFilters.length > 0 && (
                <span className="unified-badge">{state.activeFilters.length}</span>
              )}
            </button>
          )}

          {/* Sort */}
          {viewConfig.sortOptions.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="unified-action-btn"
                title="Trier"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
              
              {showSort && (
                <SortMenu
                  options={viewConfig.sortOptions}
                  currentSort={state.sortBy}
                  onSortSelect={(sort) => {
                    setSortBy(sort);
                    setShowSort(false);
                  }}
                  onClose={() => setShowSort(false)}
                />
              )}
            </div>
          )}

          {/* Primary Action */}
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="unified-primary-btn"
            >
              {primaryAction.icon}
              <span className="hidden sm:inline">{primaryAction.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="unified-active-filters">
          {state.searchQuery && (
            <span className="unified-filter-tag">
              "{state.searchQuery}"
              <button onClick={() => setSearchQuery('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {state.activeFilters.map(filterId => {
            const filter = viewConfig.filters.find(f => f.id === filterId);
            return filter ? (
              <span key={filterId} className="unified-filter-tag">
                {filter.label}
                <button onClick={() => {
                  setActiveFilters(state.activeFilters.filter(f => f !== filterId));
                }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null;
          })}
          <button
            onClick={resetFilters}
            className="unified-reset-btn"
          >
            Réinitialiser
          </button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={viewConfig.filters}
          activeFilters={state.activeFilters}
          multiSelect={viewConfig.multiSelectFilters}
          onFilterChange={setActiveFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Multi-select Actions */}
      {state.selectedItems.size > 0 && onMultiSelectAction && (
        <div className="unified-multiselect-bar">
          <span className="unified-multiselect-count">
            {state.selectedItems.size} sélectionné(s)
          </span>
          <div className="unified-multiselect-actions">
            <button onClick={clearSelection} className="unified-action-btn">
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const selected = items.filter(item => 
                  state.selectedItems.has((item as any).id)
                );
                onMultiSelectAction(selected);
                clearSelection();
              }}
              className="unified-primary-btn"
            >
              Action groupée
            </button>
          </div>
        </div>
      )}

      {/* Items Grid/List */}
      <div className={`unified-items unified-items-${state.viewMode}`}>
        {processedItems.length === 0 ? (
          <div className="unified-empty">
            <p>Aucun élément trouvé</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="unified-reset-btn">
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          processedItems.map((item, index) => (
            <div
              key={(item as any).id || index}
              className={`unified-item ${state.selectedItems.has((item as any).id) ? 'selected' : ''}`}
              onClick={() => onItemClick?.(item)}
            >
              {renderItem(item, state.viewMode)}
              
              {renderCardActions && (
                <div className="unified-item-actions">
                  {renderCardActions(item)}
                </div>
              )}
              
              <button
                className="unified-item-select"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItemSelection((item as any).id);
                  onItemSelect?.(item, !state.selectedItems.has((item as any).id));
                }}
              >
                {state.selectedItems.has((item as any).id) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ViewMenu({
  availableViews,
  currentView,
  onViewSelect,
  onClose,
}: {
  availableViews: ViewMode[];
  currentView: ViewMode;
  onViewSelect: (mode: ViewMode) => void;
  onClose: () => void;
}) {
  const viewLabels: Record<ViewMode, string> = {
    list: 'Liste',
    grid: 'Grille',
    cards: 'Cartes',
  };

  const viewIcons: Record<ViewMode, React.ReactNode> = {
    list: <List className="w-4 h-4" />,
    grid: <Grid3x3 className="w-4 h-4" />,
    cards: <LayoutGrid className="w-4 h-4" />,
  };

  return (
    <div className="unified-dropdown">
      {availableViews.map(mode => (
        <button
          key={mode}
          onClick={() => onViewSelect(mode)}
          className={`unified-dropdown-item ${currentView === mode ? 'active' : ''}`}
        >
          {viewIcons[mode]}
          {viewLabels[mode]}
          {currentView === mode && <Check className="w-4 h-4 ml-auto" />}
        </button>
      ))}
    </div>
  );
}

function SortMenu({
  options,
  currentSort,
  onSortSelect,
  onClose,
}: {
  options: SortOption[];
  currentSort: string;
  onSortSelect: (sort: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="unified-dropdown">
      {options.map(option => (
        <button
          key={option.id}
          onClick={() => onSortSelect(option.id)}
          className={`unified-dropdown-item ${currentSort === option.id ? 'active' : ''}`}
        >
          {option.icon}
          {option.label}
          {currentSort === option.id && <Check className="w-4 h-4 ml-auto" />}
        </button>
      ))}
    </div>
  );
}

function FilterPanel({
  filters,
  activeFilters,
  multiSelect = false,
  onFilterChange,
  onClose,
}: {
  filters: FilterOption[];
  activeFilters: string[];
  multiSelect?: boolean;
  onFilterChange: (filters: string[]) => void;
  onClose: () => void;
}) {
  const [localSelection, setLocalSelection] = useState<string[]>(activeFilters);

  const handleToggle = (filterId: string) => {
    if (multiSelect) {
      setLocalSelection(prev =>
        prev.includes(filterId)
          ? prev.filter(f => f !== filterId)
          : [...prev, filterId]
      );
    } else {
      onFilterChange([filterId]);
      onClose();
    }
  };

  const handleApply = () => {
    onFilterChange(localSelection);
    onClose();
  };

  const handleReset = () => {
    setLocalSelection([]);
    onFilterChange([]);
  };

  const handleSelectAll = () => {
    setLocalSelection(filters.map(f => f.id));
  };

  return (
    <div className="unified-filter-panel">
      <div className="unified-filter-header">
        <h3>Filtres</h3>
        <button onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="unified-filter-list">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => handleToggle(filter.id)}
            className={`unified-filter-option ${
              localSelection.includes(filter.id) ? 'active' : ''
            }`}
          >
            <span className="unified-filter-checkbox">
              {localSelection.includes(filter.id) && <Check className="w-3 h-3" />}
            </span>
            <span className="unified-filter-label">{filter.label}</span>
            {filter.count !== undefined && (
              <span className="unified-filter-count">{filter.count}</span>
            )}
          </button>
        ))}
      </div>

      {multiSelect && (
        <div className="unified-filter-footer">
          <button onClick={handleSelectAll} className="unified-filter-secondary-btn">
            Tout sélectionner
          </button>
          <button onClick={handleReset} className="unified-filter-secondary-btn">
            Réinitialiser
          </button>
          <button onClick={handleApply} className="unified-filter-primary-btn">
            Appliquer ({localSelection.length})
          </button>
        </div>
      )}
    </div>
  );
}
