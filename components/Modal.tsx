import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: 0, top: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#23272e",
          borderRadius: 12,
          padding: 32,
          minWidth: 320,
          minHeight: 200,
          boxShadow: "0 4px 32px #000a",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
        <button
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: 24,
            cursor: "pointer"
          }}
          onClick={onClose}
        >×</button>
      </div>
    </div>
  );
};

export default Modal;
