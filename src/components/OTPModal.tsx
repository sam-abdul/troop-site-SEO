import React, { useState, type FormEvent } from "react";
import { CircleChevronLeft, CircleChevronRight, Loader2 } from "lucide-react";

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  isLoading: boolean;
  otpTimer: number;
  handleSendOtp: () => void;
  modalColors?: {
    primary?: string;
    secondary?: string;
    bgPrimary?: string;
    bgSecondary?: string;
    border?: string;
    buttonText?: string;
  };
}

const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  isLoading,
  otpTimer,
  handleSendOtp,
  modalColors,
}) => {
  const [otp, setOtp] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onVerify(otp);
  };

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
          Enter OTP
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium opacity-50"
              style={{ color: modalColors?.primary }}
            >
              Enter OTP
            </label>
            <input
              type="number"
              id="otp"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="mt-1 p-2 block w-full bg-[var(--bg-secondary)] border border-[--border] rounded-md shadow-sm outline-none disabled:opacity-50"
              style={{
                backgroundColor: modalColors?.bgSecondary,
                borderColor: modalColors?.border,
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--bg-secondary)] border border-[--border] text-[var(--primary)] py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3"
              style={{
                backgroundColor: modalColors?.bgSecondary,
                borderColor: modalColors?.border,
                color: modalColors?.primary,
              }}
            >
              <CircleChevronLeft size={18} strokeWidth={3} />
              <span style={{ fontSize: 18, padding: 5, fontWeight: "600" }}>
                Cancel
              </span>
            </button>
            <button
              type="submit"
              disabled={isLoading || otp.length !== 4}
              className="w-full bg-[var(--secondary)] text-black py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-2 justify-center disabled:opacity-50"
              style={{
                backgroundColor: modalColors?.secondary,
                color: modalColors?.buttonText,
              }}
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              <span style={{ fontSize: 18, padding: 5, fontWeight: "600" }}>
                Verify OTP
              </span>
              <CircleChevronRight size={18} strokeWidth={3} />
            </button>
          </div>
          {otpTimer > 0 ? (
            <p
              className="text-sm text-center"
              style={{ color: modalColors?.primary }}
            >
              Resend OTP in {otpTimer} seconds
            </p>
          ) : (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isLoading}
              className="w-full mt-2 text-[var(--secondary)] hover:underline"
              style={{
                color: modalColors?.secondary,
              }}
            >
              Resend OTP
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default OtpModal;
