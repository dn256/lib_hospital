/**
 * Remove Vietnamese diacritics (dấu) from a string.
 * Example: "Cơ quan tiêu hóa" → "Co quan tieu hoa"
 */
const removeDiacritics = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
}

/**
 * Custom filter function for Vuetify v-autocomplete.
 * Supports searching Vietnamese text without diacritics.
 * 
 * Usage: <v-autocomplete :custom-filter="vietnameseFilter" ... />
 */
export const useVietnameseFilter = () => {
    const vietnameseFilter = (itemTitle: string, queryText: string, item?: any): boolean => {
        const normalizedTitle = removeDiacritics(itemTitle).toLowerCase()
        const normalizedQuery = removeDiacritics(queryText).toLowerCase()
        return normalizedTitle.includes(normalizedQuery)
    }

    return { vietnameseFilter, removeDiacritics }
}
