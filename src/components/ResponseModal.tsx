import Modal from 'react-modal';
import '../styles/components.css';

// Set the app element for react-modal
Modal.setAppElement('#root');

interface ResponseModalProps {
  isOpen: boolean;
  title: string;
  response: any;
  onClose: () => void;
}

export function ResponseModal({ isOpen, title, response, onClose }: ResponseModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fhir-react-modal"
      overlayClassName="fhir-react-modal-overlay"
      contentLabel={title}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      preventScroll={true}
      ariaHideApp={false}
    >
      <div className="fhir-modal-header">
        <h3 className="fhir-modal-title">{title}</h3>
        <button
          type="button"
          className="fhir-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
      </div>

      <div className="fhir-modal-content">
        <pre className="fhir-response-json">
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>

      <div className="fhir-modal-footer">
        <button
          type="button"
          className="fhir-btn fhir-btn-primary"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Modal>
  );
} 