import { Icons } from '@/components/Icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '1.5rem' }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
      >
        <Icons.ChevronLeft size={16} />
      </button>

      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>
        Halaman {currentPage} dari {totalPages}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
      >
        <Icons.ChevronRight size={16} />
      </button>
    </div>
  );
}
