interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav style={{
      padding: '0.5rem 1rem',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #dee2e6',
      fontSize: '0.875rem'
    }}>
      <ol style={{
        display: 'flex',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        alignItems: 'center'
      }}>
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 && (
              <span style={{ 
                margin: '0 0.5rem', 
                color: '#6c757d' 
              }}>
                /
              </span>
            )}
            {item.onClick ? (
              <button
                onClick={item.onClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  padding: 0
                }}
              >
                {item.label}
              </button>
            ) : (
              <span style={{ color: '#6c757d' }}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 