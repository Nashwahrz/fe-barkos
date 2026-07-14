import { useState, useMemo } from 'react';

export function useTablePagination<T>(data: T[], searchKeys: (keyof T | string)[], itemsPerPage: number = 10) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(item => {
      return searchKeys.some(key => {
        // Handle nested keys like 'user.name'
        const keys = (key as string).split('.');
        let val: any = item;
        for (const k of keys) {
          if (val) val = val[k];
        }
        
        if (val == null) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  
  // Ensure current page is valid when filtering changes
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, safeCurrentPage, itemsPerPage]);

  return {
    searchQuery,
    setSearchQuery,
    currentPage: safeCurrentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    totalItems: filteredData.length
  };
}
