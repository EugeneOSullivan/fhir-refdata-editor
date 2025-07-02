import React from 'react';
import '../styles/components.css';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  onClose?: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'warning',
  onConfirm,
  onCancel,
  onClose
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose?.();
  };

  const handleCancel = () => {
    onCancel();
    onClose?.();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose?.();
    } else if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  const getSeverityStyles = () => {
    switch (severity) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmClass: 'fhir-btn-danger',
          titleClass: 'fhir-text-danger'
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmClass: 'fhir-btn-warning',
          titleClass: 'fhir-text-warning'
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          confirmClass: 'fhir-btn-primary',
          titleClass: 'fhir-text-info'
        };
    }
  };

  const severityStyles = getSeverityStyles();

  return (
    <div 
      className="fhir-modal-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-message"
    >
      <div className="fhir-modal fhir-confirmation-dialog">
        <div className="fhir-modal-header">
          <div className="fhir-modal-title-container">
            <span className="fhir-confirmation-icon" role="img" aria-label="warning">
              {severityStyles.icon}
            </span>
            <h2 
              id="confirmation-dialog-title" 
              className={`fhir-modal-title ${severityStyles.titleClass}`}
            >
              {title}
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              className="fhir-modal-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              ×
            </button>
          )}
        </div>

        <div className="fhir-modal-content">
          <p id="confirmation-dialog-message" className="fhir-confirmation-message">
            {message}
          </p>
        </div>

        <div className="fhir-modal-footer">
          <button
            type="button"
            className="fhir-btn fhir-btn-secondary"
            onClick={handleCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`fhir-btn ${severityStyles.confirmClass}`}
            onClick={handleConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 