interface ResponseDisplayProps {
  data: unknown;
  onClose: () => void;
}

export function ResponseDisplay({ data, onClose }: ResponseDisplayProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      maxWidth: '80vw',
      maxHeight: '80vh',
      overflow: 'auto',
      color: 'black'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Server Response</h3>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          ×
        </button>
      </div>
      <pre style={{ 
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        backgroundColor: '#f5f5f5',
        padding: '10px',
        borderRadius: '4px'
      }}>
        {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
      </pre>
    </div>
  );
} 