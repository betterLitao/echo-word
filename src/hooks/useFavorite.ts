import { addFavorite, removeFavorite, type FavoriteItem } from '../lib/tauri'

export function useFavorite() {
  return {
    addFavorite: async (item: FavoriteItem) => addFavorite(item),
    removeFavorite: async (word: string) => removeFavorite(word),
  }
}
