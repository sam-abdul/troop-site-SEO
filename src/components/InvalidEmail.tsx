import React from "react";

interface InvalidEmailProps {
  isOpen: boolean;
  onClose: () => void;
  modalColors?: {
    primary?: string;
    secondary?: string;
    bgPrimary?: string;
    bgSecondary?: string;
    border?: string;
    buttonText?: string;
  };
}

const InvalidEmail: React.FC<InvalidEmailProps> = ({
  isOpen,
  onClose,
  modalColors,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 p-5 flex items-center justify-center z-[999999999]">
      <div
        className="bg-[var(--bg-primary)] rounded-lg p-6 w-full max-w-md"
        style={{ backgroundColor: modalColors?.bgPrimary }}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: modalColors?.primary }}
        >
          Invalid Email
        </h2>
        <p className="mb-6" style={{ color: modalColors?.primary }}>
          <span
            className="text-[var(--secondary)] font-semibold"
            style={{ color: modalColors?.secondary }}
          >
            troop
          </span>{" "}
          only accepts specific email providers (e.g.,{" "}
          <span
            className="text-[var(--secondary)] font-semibold"
            style={{ color: modalColors?.secondary }}
          >
            @gmail.com
          </span>
          ) to prevent fake email accounts and bots on the platform. Click the
          button below to view all accepted emails.
        </p>
        <div
          className="flex justify-end space-x-4 font-semibold"
          style={{ color: modalColors?.primary }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--primary)]/10 rounded-md transition-colors"
            style={{
              backgroundColor: modalColors?.bgSecondary,
              borderColor: modalColors?.border,
              color: modalColors?.primary,
            }}
          >
            Cancel
          </button>
          <a
            href="https://troop.fm/faq?faq=what-email-providers-do-we-accept"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[var(--secondary)] text-black rounded-md transition-colors"
            style={{
              backgroundColor: modalColors?.secondary,
              color: modalColors?.buttonText,
            }}
          >
            View all accepted emails
          </a>
        </div>
      </div>
    </div>
  );
};

export default InvalidEmail;
