import React, {EventHandler, MouseEventHandler} from 'react';
import {Provider} from "@supabase/supabase-js";

interface TermsModalProps {
  isOpen: boolean;
  handleAccept: () => void;
  handleDecline: () => void;
  tos: string;
}

const TermsModal: React.FC<TermsModalProps> = ({isOpen, handleAccept, handleDecline, tos}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal-parent">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-header-title">Terms of Service</h2>
          </div>
          <div className="modal-body">
            <p className="modal-body-content">{tos}</p>
          </div>
          <div className="modal-actions">
            <button className="modal-accept" onClick={handleAccept}>Accept</button>
            <button className="modal-decline" onClick={handleDecline}>Decline</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
