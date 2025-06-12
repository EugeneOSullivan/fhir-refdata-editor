import '../styles/components.css';

interface ResponseDisplayProps {
  data: unknown;
  onClose: () => void;
}

export function ResponseDisplay({ data, onClose }: ResponseDisplayProps) {
  return (
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
      <pre className="fhir-modal-content">
        {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
      </pre>
    </div>
  );
} 