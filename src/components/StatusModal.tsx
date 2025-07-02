import React from 'react';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  success: boolean;
  message: string;
  response: any;
}

export const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose, success, message, response }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{success ? 'Success' : 'Error'}</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">{message}</p>
            <pre className="text-xs text-left text-gray-600 bg-gray-100 p-2 rounded-md mt-4">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
          <div className="items-center px-4 py-3">
            <button
              id="ok-btn"
              className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={onClose}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};