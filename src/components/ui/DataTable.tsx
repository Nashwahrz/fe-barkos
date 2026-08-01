import React from 'react';
import { Icons } from '@/components/Icons';
import { Skeleton } from '@/components/Skeleton';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  skeletonRows?: number;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  skeletonRows = 6,
  emptyMessage = 'Tidak ada data ditemukan.',
}: DataTableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: 'max-content', borderCollapse: 'collapse', background: 'var(--card)' }}>
        <thead style={{
          background: 'var(--input)',
          textAlign: 'left',
          fontSize: '0.75rem',
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  padding: '1.1rem 1.25rem',
                  fontWeight: 700,
                  textAlign: col.align || 'left',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ fontSize: '0.9rem' }}>
          {loading && Array.from({ length: skeletonRows }).map((_, i) => (
            <tr key={`skeleton-${i}`} style={{ borderBottom: '1px solid var(--border)' }}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: '1.1rem 1.25rem' }}>
                  <Skeleton height="1rem" width={col.align === 'right' ? '60%' : '80%'} />
                </td>
              ))}
            </tr>
          ))}

          {!loading && data.map((row, i) => (
            <tr
              key={keyExtractor(row)}
              className="hover-bg-input"
              style={{
                borderBottom: '1px solid var(--border)',
                background: i % 2 === 1 ? 'var(--background)' : 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '1.1rem 1.25rem', textAlign: col.align || 'left' }}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                <Icons.Inbox size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{emptyMessage}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
