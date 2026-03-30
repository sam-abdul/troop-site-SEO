import { Loader } from "lucide-react";
import React, { type ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  cancelText?: string;
  confirmText?: string;
  btnColor?: string;
  redColor?: string;
  isDelete?: boolean;
  isLoading?: boolean;
  modalColors?: {
    primary?: string;
    secondary?: string;
    bgPrimary?: string;
    bgSecondary?: string;
    border?: string;
    buttonText?: string;
  };
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  cancelText = "No",
  confirmText = "Yes",
  btnColor = "#14CD8A",
  redColor = "#EF4444",
  isDelete = false,
  isLoading = false,
  modalColors,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 p-5 flex items-center justify-center z-[999999999]">
      <div
        className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-6 w-full max-w-md shadow-xl"
        style={{
          backgroundColor: modalColors?.bgPrimary,
          borderColor: modalColors?.border,
        }}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: modalColors?.primary }}
        >
          {title}
        </h2>
        <p className="mb-6 text-base" style={{ color: modalColors?.primary }}>
          {message}
        </p>
        <div className="flex justify-end space-x-4 font-semibold">
          <button
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 text-base bg-[var(--primary)]/10 rounded-md transition-colors disabled:opacity-50"
            style={{
              backgroundColor: modalColors?.bgSecondary,
              borderColor: modalColors?.border,
              color: modalColors?.primary,
            }}
          >
            {cancelText}
          </button>
          <button
            disabled={isLoading}
            onClick={onConfirm}
            style={{
              backgroundColor: isDelete
                ? redColor
                : modalColors?.secondary || btnColor,
              color: modalColors?.buttonText,
            }}
            className={`px-4 py-2 text-base flex items-center gap-2 ${
              isDelete ? "text-white" : "text-black"
            } rounded-md transition-colors disabled:opacity-50`}
          >
            {confirmText}{" "}
            {isLoading && <Loader className="animate-spin h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
