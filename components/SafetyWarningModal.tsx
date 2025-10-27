import React from 'react';
import { WarningIcon, XIcon } from './icons';

interface SafetyWarningModalProps {
  error: string;
  onClose: () => void;
}

export const SafetyWarningModal: React.FC<SafetyWarningModalProps> = ({ error, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" aria-modal="true" role="dialog">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full m-4 border border-yellow-500/50">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-yellow-500/20">
                <WarningIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-yellow-300" id="modal-title">
                Content Blocked
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-300">
                  Your request could not be processed because it was flagged by our safety policy.
                </p>
                <p className="mt-2 text-xs text-gray-400 bg-gray-900/60 p-2 rounded-md border border-gray-700">
                  <strong>Reason:</strong> {error.replace('Your request was blocked by the safety filter ', '')}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 px-6 py-3 flex justify-end border-t border-gray-700/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
