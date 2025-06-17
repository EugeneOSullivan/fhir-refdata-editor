import React from 'react';

interface LoadingSkeletonProps {
  type?: 'table' | 'form' | 'list';
  rows?: number;
}

export function LoadingSkeleton({ type = 'table', rows = 5 }: LoadingSkeletonProps) {
  const renderTableSkeleton = () => (
    <div className="fhir-form-wrapper">
      <div className="fhir-form-wrapper-content">
        {/* Search skeleton */}
        <div className="fhir-search-container">
          <div className="fhir-skeleton-input" />
        </div>
        
        {/* Table skeleton */}
        <table className="fhir-table">
          <thead>
            <tr>
              {['Name', 'Type', 'Status', 'Actions'].map((header) => (
                <th key={header} className="fhir-table-header">
                  <div className="fhir-skeleton-text" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, index) => (
              <tr key={index} className="fhir-table-row">
                <td className="fhir-table-cell">
                  <div className="fhir-skeleton-text" />
                </td>
                <td className="fhir-table-cell">
                  <div className="fhir-skeleton-text" />
                </td>
                <td className="fhir-table-cell">
                  <div className="fhir-skeleton-badge" />
                </td>
                <td className="fhir-table-cell">
                  <div className="fhir-skeleton-button" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="fhir-form-wrapper">
      <div className="fhir-form-wrapper-header">
        <div className="fhir-skeleton-text" />
      </div>
      <div className="fhir-form-wrapper-content">
        {Array.from({ length: 3 }).map((_, index) => (
          <fieldset key={index} className="fhir-fieldset">
            <legend className="fhir-legend">
              <div className="fhir-skeleton-text" />
            </legend>
            <div className="fhir-grid-2 fhir-field-spacing">
              <div>
                <div className="fhir-skeleton-label" />
                <div className="fhir-skeleton-input" />
              </div>
              <div>
                <div className="fhir-skeleton-label" />
                <div className="fhir-skeleton-input" />
              </div>
            </div>
          </fieldset>
        ))}
        <div className="fhir-form-wrapper-actions">
          <div className="fhir-skeleton-button-large" />
        </div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="fhir-form-wrapper">
      <div className="fhir-form-wrapper-content">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="fhir-skeleton-list-item" />
        ))}
      </div>
    </div>
  );

  switch (type) {
    case 'table':
      return renderTableSkeleton();
    case 'form':
      return renderFormSkeleton();
    case 'list':
      return renderListSkeleton();
    default:
      return renderTableSkeleton();
  }
} 