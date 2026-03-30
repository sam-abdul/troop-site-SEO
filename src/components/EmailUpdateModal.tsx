import React, { useState } from "react";
import { X, Loader2, CircleChevronRight } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { isTrustedEmail } from "../utils/helper";
import InvalidEmail from "./InvalidEmail";

interface EmailUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateEmail: (email: string) => Promise<void>;
  modalColors?: {
    primary?: string;
    secondary?: string;
    bgPrimary?: string;
    bgSecondary?: string;
    border?: string;
    buttonText?: string;
  };
}

const EmailUpdateModal: React.FC<EmailUpdateModalProps> = ({
  isOpen,
  onClose,
  onUpdateEmail,
  modalColors,
}) => {
  const [newEmail, setNewEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [showInvalidEmail, setShowInvalidEmail] = useState<boolean>(false);

  const handleSendOtp = async () => {
    if (!isTrustedEmail(newEmail)) {
      toast.error("Please enter a valid email");
      setShowInvalidEmail(true);
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("https://troop-node-backend.onrender.com/troop-node-otp/send-otp", {
        email: newEmail,
      });
      setOtpSent(true);
      setOtpTimer(30);
      toast.success("OTP sent successfully");
    } catch (error) {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      await axios.post("https://troop-node-backend.onrender.com/troop-node-otp/verify-otp", {
        email: newEmail,
        otp,
      });
      await onUpdateEmail(newEmail);
      onClose();
    } catch (error) {
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999999] p-5">
      <div
        className="bg-[var(--bg-primary)] rounded-lg p-6 w-full max-w-md"
        style={{ backgroundColor: modalColors?.bgPrimary }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            className="text-xl font-bold"
            style={{ color: modalColors?.primary }}
          >
            Update Email
          </h2>
          <button
            onClick={onClose}
            className="text-sm text-white bg-[var(--bg-seconary)]"
            style={{
              backgroundColor: modalColors?.bgSecondary,
              borderColor: modalColors?.border,
              color: modalColors?.primary,
              padding: 5,
              borderRadius: 100,
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm mb-3" style={{ color: modalColors?.primary }}>
          Your email address cannot receive emails, and if you purchase a ticket
          with this email address you won't be able to get your ticket. Enter a
          new email to continue.
        </p>
        {!otpSent ? (
          <>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              className="w-full p-2 mb-4 bg-[var(--bg-secondary)] border border-[--border] rounded"
              style={{
                backgroundColor: modalColors?.bgSecondary,
                borderColor: modalColors?.border,
                color: modalColors?.primary,
              }}
            />
            <button
              onClick={handleSendOtp}
              disabled={isLoading || !newEmail}
              className="w-full bg-[var(--secondary)] text-black py-2 px-4 rounded-md hover:opacity-80 flex items-center justify-center gap-2 font-bold"
              style={{
                backgroundColor: modalColors?.secondary,
                color: modalColors?.buttonText,
              }}
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              <span>Continue</span>
              <CircleChevronRight size={18} strokeWidth={3} />
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full p-2 mb-4 bg-[var(--bg-secondary)] border border-[--border] rounded"
              style={{
                backgroundColor: modalColors?.bgSecondary,
                borderColor: modalColors?.border,
                color: modalColors?.primary,
              }}
            />
            <button
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.length !== 4}
              className="w-full bg-[var(--secondary)] text-black py-2 px-4 rounded-md hover:opacity-80 flex items-center justify-center gap-2 font-bold"
              style={{
                backgroundColor: modalColors?.secondary,
                color: modalColors?.buttonText,
              }}
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              <span>Verify OTP</span>
              <CircleChevronRight size={18} strokeWidth={3} />
            </button>
            {otpTimer > 0 ? (
              <p className="text-sm text-center mt-2">
                Resend OTP in {otpTimer} seconds
              </p>
            ) : (
              <button
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full mt-2 text-[var(--secondary)] hover:underline"
                style={{
                  backgroundColor: modalColors?.secondary,
                  color: modalColors?.buttonText,
                }}
              >
                Resend OTP
              </button>
            )}
          </>
        )}
      </div>
      <InvalidEmail
        isOpen={showInvalidEmail}
        onClose={() => setShowInvalidEmail(false)}
        modalColors={modalColors}
      />
    </div>
  );
};

export default EmailUpdateModal;
