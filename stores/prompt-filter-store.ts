import { create } from 'zustand'

interface FilterState {
  query: string
  category: string | null
  selectedTags: string[]
  setQuery: (query: string) => void
  setCategory: (category: string | null) => void
  toggleTag: (tag: string) => void
  clearFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  query: '',
  category: null,
  selectedTags: [],
  setQuery: (query) => set({ query }),
  setCategory: (category) => set({ category }),
  toggleTag: (tag) =>
    set((state) => ({
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag],
    })),
  clearFilters: () => set({ query: '', category: null, selectedTags: [] }),
}))
