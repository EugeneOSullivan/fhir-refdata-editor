import '../styles/components.css';

interface ResponseDisplayProps {
  data: unknown;
  onClose: () => void;
}

export function ResponseDisplay({ data, onClose }: ResponseDisplayProps) {
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fhir-modal-overlay" onClick={handleBackdropClick}>
      <div className="fhir-modal">
        <div className="fhir-modal-header">
          <h3 className="fhir-modal-title">Server Response</h3>
          <button 
            onClick={onClose}
            className="fhir-modal-close"
          >
            ×
          </button>
        </div>
        <div className="fhir-modal-content">
          <pre className="fhir-response-json">
            {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
          </pre>
        </div>
      </div>
    </div>
  );
} 