import React, { useState } from "react";
import ReactDOM from "react-dom";

interface CustomConfirmProps {
  message: string;
  title: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const CustomConfirm: React.FC<CustomConfirmProps> = ({
  message,
  title,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 p-5 flex items-center justify-center z-[99999999999]">
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 max-md:text-lg">{title}</h2>
        <p className="mb-4 max-md:text-sm text-wrap flex-wrap whitespace-break-spaces">
          {message}
        </p>
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[var(--primary)]/10 font-semibold rounded-md transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[var(--secondary)] font-semibold text-black rounded-md transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

type ConfirmFunction = (title: string, message: string) => Promise<boolean>;

interface UseConfirmReturn {
  confirm: ConfirmFunction;
  ConfirmComponent: React.FC;
}

const useConfirm = (): UseConfirmReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
    null
  );

  const confirm: ConfirmFunction = (title, msg) => {
    setMessage(msg);
    setTitle(title);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolver?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolver?.(false);
  };

  const ConfirmComponent: React.FC = () =>
    isOpen ? (
      <CustomConfirm
        message={message}
        title={title}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ) : null;

  return { confirm, ConfirmComponent };
};

export default useConfirm;
