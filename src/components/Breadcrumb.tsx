import '../styles/components.css';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="fhir-breadcrumb">
      <ol className="fhir-breadcrumb-list">
        {items.map((item, index) => (
          <li key={index} className="fhir-breadcrumb-item">
            {index > 0 && (
              <span className="fhir-breadcrumb-separator">
                /
              </span>
            )}
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="fhir-breadcrumb-link"
              >
                {item.label}
              </button>
            ) : (
              <span className="fhir-breadcrumb-current">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 