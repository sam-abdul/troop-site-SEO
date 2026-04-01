import { useState, useEffect, useRef } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import {
  generateRandomPassword,
  getApiErrorMessage,
  getFee,
  isTrustedEmail,
} from "../../utils/helper";
import toast from "react-hot-toast";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CircleChevronLeft,
  CircleChevronRight,
  CircleMinus,
  CirclePlus,
  Info,
  Loader,
  Loader2,
  Lock,
  Plus,
  TicketIcon,
  X,
} from "lucide-react";
import ConfirmModal from "../ConfirmModal";
import { countries } from "../../utils/countries";
import {
  type Discount,
  type EventDetails,
  type EventTicket,
} from "../../types/event";
import { type UserDetails } from "../../types/user";
import OtpModal from "../OTPModal";
import EmailUpdateModal from "../EmailUpdateModal";
import InvalidEmail from "../InvalidEmail";
import useConfirm from "../CustomConfirm";
import api from "../../utils/apiClient";
import { useAuth } from "../../context/AuthContext";
import { BsPaypal } from "react-icons/bs";

interface JoinEventProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  event: EventDetails;
  id: string | undefined;
  modalColors?: {
    primary?: string;
    secondary?: string;
    bgPrimary?: string;
    bgSecondary?: string;
    border?: string;
    buttonText?: string;
    refundBg?: string;
    refundText?: string;
  };
}

export default function JoinEvent({
  isOpen,
  setIsOpen,
  event,
  id,
  modalColors,
}: JoinEventProps) {
  // Default colors
  const colors = {
    primary: modalColors?.primary || "#ffffff",
    secondary: modalColors?.secondary || "#49DD96",
    bgPrimary: modalColors?.bgPrimary || "#121622",
    bgSecondary: modalColors?.bgSecondary || "#1B2030",
    border: modalColors?.border || "rgba(255, 255, 255, 0.05)",
    buttonText: modalColors?.buttonText || "#000000",
    refundBg: modalColors?.refundBg || "#1B2030",
    refundText: modalColors?.refundText || "#ffffff",
  };
  const router = useRouter();
  const {
    eventUserID: userID,
    eventFullUserDetails: fullUserDetails,
    setEventFullUserDetails: setFullUserDetails,
    setEventUserID: setUserID,
  } = useAuth();
  const { confirm, ConfirmComponent } = useConfirm();
  const [currentStep, setCurrentStep] = useState("personal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<EventTicket>();
  const [isAdded, setIsAdded] = useState<boolean | null>(null);
  const [steps] = useState(
    event.isFree
      ? ["personal", "userdetails", "payment"]
      : ["personal", "userdetails", "payment", "summary"],
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isOtpFreeOpen, setIsOtpFreeOpen] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [showInvalidEmail, setShowInvalidEmail] = useState(false);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [showAdditionalEmails, setShowAdditionalEmails] = useState(false);
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);
  const [showEmailUpdateModal, setShowEmailUpdateModal] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingPaystack, setLoadingPaystack] = useState(false);
  const [loadingPayPal, setLoadingPayPal] = useState(false);
  const [isVerifyingDiscount, setIsVerifyingDiscount] = useState(false);
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [ticketPhoneNumber, setTicketPhoneNumber] = useState("");
  const [isSavingTicketPhoneNumber, setIsSavingTicketPhoneNumber] =
    useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const affiliateCode = queryParams.get("aff") || "";

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTicketPhoneNumber(String(fullUserDetails?.ticketPhoneNumber || ""));
  }, [fullUserDetails?.ticketPhoneNumber]);

  const getNormalizedTicketPhoneNumber = () =>
    ticketPhoneNumber.replace(/\s+/g, " ").trim();

  const hasValidTicketPhoneNumber = (value: string) =>
    value.replace(/\D/g, "").length >= 7;

  const persistTicketPhoneNumberIfNeeded = async () => {
    if (!event.collectPhoneNumber) return true;
    if (!userID) return false;

    const normalizedPhone = getNormalizedTicketPhoneNumber();
    if (!hasValidTicketPhoneNumber(normalizedPhone)) {
      toast.error("Please enter a valid phone number");
      return false;
    }

    try {
      setIsSavingTicketPhoneNumber(true);
      await api.post(
        "https://troop-node-dashboard.onrender.com/api/ticket-auth/auth/update-ticket-phone",
        {
          userId: userID,
          phoneNumber: normalizedPhone,
        },
      );

      setFullUserDetails((prev: any) =>
        prev
          ? {
              ...prev,
              ticketPhoneNumber: normalizedPhone,
            }
          : prev,
      );

      return true;
    } catch (error) {
      console.error("Error updating ticket phone number:", error);
      toast.error("Failed to save phone number. Please try again.");
      return false;
    } finally {
      setIsSavingTicketPhoneNumber(false);
    }
  };

  const checkAttendeeStatus = async () => {
    if (id && userID) {
      try {
        const response = await api.get(
          `https://troop-node-dashboard.onrender.com/api/ticket-auth/events/${id}/attendees/${userID}`,
        );

        setIsAdded(response.data.isAttendee);
      } catch (error) {
        console.error("Error checking attendee status:", error);
      }
    } else {
      setIsAdded(false);
    }
  };

  useEffect(() => {
    checkAttendeeStatus();
  }, [id, userID]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  const handleClose = () => {
    setIsOpen(false);
    setUserID(null);
    setFullUserDetails(null);
    setCurrentStep("personal");
    setIsOtpSent(false);
    setOtp("");
    setOtpTimer(0);
  };

  type CheckUserResult =
    | { status: "existing"; user: any; userId: string }
    | { status: "unverified" }
    | { status: "new" }
    | { status: "error"; message: string };

  async function checkUserExists(email: string): Promise<CheckUserResult> {
    try {
      const res = await api.post(
        "https://troop-node-dashboard.onrender.com/api/ticket-auth/auth/signin",
        { email },
      );

      const user = res.data.userData;
      const userId = res.data.userId;

      if (user.canReceiveEmail) {
        return { status: "existing", user, userId };
      } else {
        return { status: "unverified" };
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return { status: "new" };
      }

      return { status: "error", message: getApiErrorMessage(err) };
    }
  }

  const handleNewUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleConfirm();
  };

  const handleConfirm = async () => {
    setIsConfirmOpen(false);
    setIsLoading(true);
    const password = generateRandomPassword();

    try {
      const response = await api.post(
        "https://troop-node-dashboard.onrender.com/api/ticket-auth/auth/signup",
        {
          email,
          password,
          name,
        },
      );

      setFullUserDetails(response.data.userData);
      localStorage.setItem(
        "troopPurchaseUser",
        JSON.stringify({
          email,
          password,
          userDetails: response.data.userData,
        }),
      );
      setUserID(response.data.userId);
      toast.success("Welcome to Troop! 🎉");
      setIsLoading(false);
      setCurrentStep("userdetails");
    } catch (err) {
      setIsLoading(false);
      const error = err as AxiosError;
      toast.error(
        error.response &&
          error.response.data &&
          typeof error.response.data === "object" &&
          "error" in error.response.data
          ? String(error.response.data.error)
          : error instanceof Error && error.message == "Network Error"
            ? "Network error. Please confirm your Wi-Fi or mobile data connection and retry."
            : "Something went wrong. Please try again.",
      );

      // Error Reporting
      if (
        !error.response ||
        !error.response.data ||
        typeof error.response.data !== "object" ||
        !("error" in error.response.data)
      ) {
        await axios.post(
          "https://troop-node-backend.onrender.com/troop-node-otp/send-error-report",
          {
            error_message: `This user - ${email} wanted to create an account, from the handleConfirm function, but an error occurred.`,
            error_code: error.code || "Unknown Error Code",
            request_url: error.config?.url || "Unknown URL",
            info: error.message || error.toString(),
            status_code: error.response?.status || "No status",
            status_text: error.response?.statusText || "No status text",
            browser_error:
              error instanceof Error ? error.message : "Unknown error type",
          },
        );
      }
    }
  };

  const handleSendOtp = async () => {
    if (event.checkEmail) {
      setIsLoading(true);
      try {
        const response = await axios.post(
          "https://troop-node-backend.onrender.com/troop-node-otp/verify-email",
          {
            email,
          },
        );

        if (response.data.isValid) {
          if (id == "qkouKLI3mlRKyyMuZtl1") {
            setCurrentStep("newUser");
          } else {
            await axios.post(
              "https://troop-node-backend.onrender.com/troop-node-otp/send-otp",
              {
                email,
                userId: event.userID,
              },
            );
            setCurrentStep("otp");
            setIsOtpSent(true);
            setOtpTimer(30);
            toast.success("OTP sent successfully");
          }
        } else {
          setIsOtpSent(false);
          toast.error("Invalid email address. Please use a valid email.");
        }
      } catch (err) {
        const error = err as AxiosError;
        if (error.response && error.response.status === 400) {
          toast.error("Invalid email address. Please use a valid email.");
          setIsOtpSent(false);
        } else if (error.response && error.response.status === 429) {
          setIsOtpSent(false);
          toast.error("Too many OTP requests, try again in 30mins.");
        } else if (error instanceof Error && error.message == "Network Error") {
          setIsOtpSent(false);
          toast.error(
            "Network error. Please confirm your Wi-Fi or mobile data connection and retry.",
          );
        } else {
          setIsOtpSent(false);
          console.error("Error verifying or sending OTP:", error);
          toast.error("Failed to send OTP. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        if (id == "qkouKLI3mlRKyyMuZtl1") {
          setCurrentStep("newUser");
        } else {
          await axios.post(
            "https://troop-node-backend.onrender.com/troop-node-otp/send-otp",
            {
              email,
              userId: event.userID,
            },
          );
          setCurrentStep("otp");
          setIsOtpSent(true);
          setOtpTimer(30);
          toast.success("OTP sent successfully");
        }
      } catch (err) {
        const error = err as AxiosError;
        if (error.response && error.response.status === 429) {
          toast.error("Too many OTP requests, try again in 30mins.");
          setIsOtpSent(false);
        } else if (error instanceof Error && error.message == "Network Error") {
          setIsOtpSent(false);
          toast.error(
            "Network error. Please confirm your Wi-Fi or mobile data connection and retry.",
          );
        } else {
          console.error("Error sending OTP:", error);
          toast.error("Failed to send OTP. Please try again later.");
          setIsOtpSent(false);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      await axios.post(
        "https://troop-node-backend.onrender.com/troop-node-otp/verify-otp",
        {
          email,
          otp,
        },
      );

      toast.success("OTP verified successfully");
      setCurrentStep("newUser");
    } catch (err) {
      const error = err as AxiosError;
      if (error.response && error.response.status === 400) {
        toast.error("Invalid OTP! Please try again.");
      } else if (error instanceof Error && error.message == "Network Error") {
        toast.error(
          "Network error. Please confirm your Wi-Fi or mobile data connection and retry.",
        );
      } else {
        toast.error("Failed to verify OTP. Please try again later.");
        console.error("OTP verification error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtpFree = async () => {
    if (event.checkEmail) {
      setIsLoading(true);
      try {
        const response = await axios.post(
          "https://troop-node-backend.onrender.com/troop-node-otp/verify-email",
          {
            email,
          },
        );

        if (response.data.isValid) {
          await axios.post(
            "https://troop-node-backend.onrender.com/troop-node-otp/send-otp",
            {
              email,
              userId: event.userID,
            },
          );
          setIsOtpSent(true);
          setOtpTimer(30);
          toast.success("OTP sent successfully");
        } else {
          toast.error("Invalid email address. Please use a valid email.");
        }
      } catch (err) {
        const error = err as AxiosError;
        if (error.response && error.response.status === 400) {
          toast.error("Invalid email address. Please use a valid email.");
        } else if (error.response && error.response.status === 429) {
          toast.error("Too many OTP requests, try again in 30mins.");
        } else if (error instanceof Error && error.message == "Network Error") {
          toast.error(
            "Network error. Please confirm your Wi-Fi or mobile data connection and retry.",
          );
        } else {
          console.error("Error verifying or sending OTP:", error);
          toast.error("Failed to send OTP. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        await axios.post(
          "https://troop-node-backend.onrender.com/troop-node-otp/send-otp",
          {
            email,
            userId: event.userID,
          },
        );
        setIsOtpSent(true);
        setOtpTimer(30);
        toast.success("OTP sent successfully");
      } catch (err) {
        const error = err as AxiosError;
        if (error.response && error.response.status === 429) {
          toast.error("Too many OTP requests, try again in 30mins.");
        } else if (error instanceof Error && error.message == "Network Error") {
          toast.error(
            "Network error. Please confirm your Wi-Fi or mobile data connection and retry.",
          );
        } else {
          console.error("Error sending OTP:", error);
          toast.error("Failed to send OTP. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyOtpFree = async (otp: string) => {
    setIsLoading(true);
    try {
      await axios.post(
        "https://troop-node-backend.onrender.com/troop-node-otp/verify-otp",
        {
          email,
          otp,
        },
      );

      toast.success("OTP verified successfully");
      setIsOtpFreeOpen(false);
      handleIncrement(selectedTicket);
    } catch (err) {
      const error = err as AxiosError;
      if (error.response && error.response.status === 400) {
        toast.error("Invalid OTP! Please try again.");
      } else if (error instanceof Error && error.message == "Network Error") {
        toast.error(
          "Network error. Please confirm your Wi-Fi or mobile data connection and retry.",
        );
      } else {
        toast.error("Failed to verify OTP. Please try again later.");
        console.error("OTP verification error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  async function handleIncrement(selectedTicket?: EventTicket) {
    if (!fullUserDetails) {
      return;
    }

    try {
      if (userID) {
        if (fullUserDetails.email && isTrustedEmail(fullUserDetails.email)) {
          setIsLoading(true);

          const payload = selectedTicket
            ? {
                eventId: id,
                userID: userID,
                fullUserDetails: {
                  photoURL: fullUserDetails.photoURL,
                  name: fullUserDetails.name,
                },
                ticket: {
                  name: selectedTicket.name,
                  price: selectedTicket.price,
                  instruction: selectedTicket.instruction || "",
                },
                referralCode,
                affiliateCode,
                quickPay: false,
                ticketPhoneNumber: getNormalizedTicketPhoneNumber(),
              }
            : {
                eventId: id,
                userID: userID,
                fullUserDetails: {
                  photoURL: fullUserDetails.photoURL,
                  name: fullUserDetails.name,
                },
                referralCode,
                affiliateCode,
                quickPay: false,
                ticketPhoneNumber: getNormalizedTicketPhoneNumber(),
              };

          const response = await api.post(
            "https://troop-node-payment.onrender.com/api/core/join-event",
            payload,
          );

          if (response.status === 200) {
            // toast.success(response.data.message);
            if (event.requireApproval && event.isFree) {
              router.push(`/checkout-pending/${id}`);
            } else {
              router.push(`/checkout-success/${id}`);
            }
            setIsLoading(false);
            setIsOpen(false);
            setUserID(null);
            setFullUserDetails(null);
          }
        } else {
          toast.error("Please make use of a valid email to join this event.");
        }
      }
    } catch (err) {
      const error = err as AxiosError;
      setIsLoading(false);
      console.error("Error joining event", error);
      let errorMessage = "An error occurred while joining event";
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
      ) {
        errorMessage = error.response.data.message as string;
      }

      toast.error(
        error instanceof Error && error.message == "Network Error"
          ? "Network error. Please confirm your Wi-Fi or mobile data connection and retry."
          : errorMessage,
      );

      // Error Reporting
      if (
        !error.response ||
        !error.response.data ||
        typeof error.response.data !== "object" ||
        !("message" in error.response.data)
      ) {
        await axios.post(
          "https://troop-node-backend.onrender.com/troop-node-otp/send-error-report",
          {
            error_message: `This user - ${userID} wanted to join free event from handleIncrement function, but an error occurred.`,
            error_code: error.code || "Unknown Error Code",
            request_url: error.config?.url || "Unknown URL",
            info: error.message || error.toString(),
            status_code: error.response?.status || "No status",
            status_text: error.response?.statusText || "No status text",
            browser_error:
              error instanceof Error ? error.message : "Unknown error type",
          },
        );
      }
    }
  }

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isTrustedEmail(email)) {
      setShowInvalidEmail(true);
      return toast.error("Please enter a valid email");
    }

    setIsLoading(true);

    const result = await checkUserExists(email);

    setIsLoading(false);

    switch (result.status) {
      case "existing":
        setFullUserDetails(result.user);
        setUserID(result.userId);
        return setCurrentStep("userdetails");

      case "unverified":
        return setShowEmailUpdateModal(true);

      case "new":
        return handleSendOtp();

      case "error":
        return toast.error(result.message || "Something went wrong.");
    }
  };

  const handleUpdateEmail = async (newEmail: string) => {
    try {
      await api.post(
        "https://troop-node-dashboard.onrender.com/api/ticket-auth/auth/update-email",
        {
          userId: userID,
          newEmail,
        },
      );

      setFullUserDetails({
        ...(fullUserDetails as UserDetails),
        email: newEmail,
        canReceiveEmail: true,
      });
      toast.success("Email updated successfully");
      setShowEmailUpdateModal(false);
      setCurrentStep("userdetails");
    } catch (err) {
      const error = err as AxiosError;
      console.error("Error updating email:", error);
      let errorMessage = "An error occurred while updating email";

      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "error" in error.response.data
      ) {
        errorMessage = error.response.data.error as string;
      }

      toast.error(
        error instanceof Error && error.message == "Network Error"
          ? "Network error. Please confirm your Wi-Fi or mobile data connection and retry."
          : errorMessage,
      );

      // Error Reporting
      if (
        !error.response ||
        !error.response.data ||
        typeof error.response.data !== "object" ||
        !("error" in error.response.data)
      ) {
        await axios.post(
          "https://troop-node-backend.onrender.com/troop-node-otp/send-error-report",
          {
            error_message: `This user - ${userID} wanted to update his email from the handleUpdateEmail function, but an error occurred.`,
            error_code: error.code || "Unknown Error Code",
            request_url: error.config?.url || "Unknown URL",
            info: error.message || error.toString(),
            status_code: error.response?.status || "No status",
            status_text: error.response?.statusText || "No status text",
            browser_error:
              error instanceof Error ? error.message : "Unknown error type",
          },
        );
      }
    }
  };

  const initializeStripe = async () => {
    if (!fullUserDetails) {
      toast.error("No user found");
      return;
    }

    if (userID) {
      if (event.tickets && !selectedTicket) {
        toast.error("Select a ticket to continue");
        setLoadingStripe(false);
        setIsLoading(false);
      } else if (
        Number(event.spotTaken) >= Number(event.spot) &&
        !event.isUnlimited
      ) {
        toast.error("Sorry! Event is already filled up 😔");
      } else {
        try {
          if (showAdditionalEmails) {
            const allEmailsValid = isAdded
              ? additionalEmails.length === numberOfTickets &&
                additionalEmails.every(
                  (email) => email.trim() !== "" && isTrustedEmail(email),
                )
              : additionalEmails.length === numberOfTickets - 1 &&
                additionalEmails.every(
                  (email) => email.trim() !== "" && isTrustedEmail(email),
                );

            if (!allEmailsValid) {
              toast.error(
                "Please ensure all additional emails are added and valid.",
              );
              return;
            }
          }

          if (showAdditionalEmails) {
            const isConfirmed = await confirm(
              "Confirm Additional Emails",
              `Are you sure you want to proceed with these additional mails?\n\n${additionalEmails
                .map((email, i) => `Email ${i + 1}: ${email}`)
                .join("\n")}`,
            );
            if (!isConfirmed) {
              return;
            }
          }
          setLoadingStripe(true);

          let customerId = fullUserDetails.customerId || null;

          if (!customerId && selectedTicket && selectedTicket.price !== "0") {
            const response = await api.post(
              `https://troop-node-payment.onrender.com/api/core/get-secret`,
              {
                name: fullUserDetails.name,
                email: fullUserDetails.email,
              },
            );
            customerId = response.data.customerId;
          }

          const response = await api.post(
            selectedTicket && selectedTicket.price == "0"
              ? `https://troop-node-payment.onrender.com/api/core/checkout-free-event`
              : `https://troop-node-payment.onrender.com/api/core/checkout-session`,

            selectedTicket
              ? {
                  amount: selectedTicket.price,
                  stripeCustomerId: customerId,
                  eventId: id,
                  userId: userID,
                  hostId: event.userID,
                  fullUserDetails: {
                    name: fullUserDetails.name,
                    photoURL: fullUserDetails.photoURL,
                  },
                  ticketName: selectedTicket.name,
                  instruction: selectedTicket.instruction || "",
                  eventName: event.title.trim(),
                  referralCode,
                  affiliateCode,
                  numberOfTickets,
                  additionalEmails: showAdditionalEmails
                    ? additionalEmails
                    : [],
                  buyAgainAdditional: showAdditionalEmails && isAdded,
                  country: countries[event.country].code,
                  discount: discount || null,
                  addPercent: selectedTicket.addPercent || false,
                  extraPercent: selectedTicket.extraPercent || 0,
                  ticketPhoneNumber: getNormalizedTicketPhoneNumber(),
                }
              : {
                  amount: event.ticketAmount,
                  stripeCustomerId: customerId,
                  eventId: id,
                  userId: userID,
                  hostId: event.userID,
                  fullUserDetails: {
                    name: fullUserDetails.name,
                    photoURL: fullUserDetails.photoURL,
                  },
                  eventName: event.title.trim(),
                  referralCode,
                  affiliateCode,
                  ticketPhoneNumber: getNormalizedTicketPhoneNumber(),
                },
          );

          if (selectedTicket && selectedTicket.price == "0") {
            setIsLoading(false);
            setLoadingStripe(false);
            handleClose();
            toast.success("Ticket Purchase successful 🎉");
            router.push(`/checkout-success/${id}`);
          } else {
            const { session_url } = response.data;

            try {
              window.location.assign(session_url);
            } catch (error) {
              toast.error("Unable to open payment window. Please try again");
            }
          }
        } catch (err) {
          const error = err as AxiosError;
          toast.error(
            error.response &&
              error.response.data &&
              typeof error.response.data === "object" &&
              "message" in error.response.data
              ? String(error.response.data.message)
              : error instanceof Error && error.message == "Network Error"
                ? "Network error. Please confirm your Wi-Fi or mobile data connection and retry."
                : "Something went wrong, Please try again.",
          );
          setIsLoading(false);
          setLoadingStripe(false);

          // Error Reporting
          if (
            !error.response ||
            !error.response.data ||
            typeof error.response.data !== "object" ||
            !("message" in error.response.data)
          ) {
            await axios.post(
              "https://troop-node-backend.onrender.com/troop-node-otp/send-error-report",
              {
                error_message: `This user - ${userID} wanted to pay with stripe, from the initializeStripe function, but an error occurred.`,
                error_code: error.code || "Unknown Error Code",
                request_url: error.config?.url || "Unknown URL",
                info: error.message || error.toString(),
                status_code: error.response?.status || "No status",
                status_text: error.response?.statusText || "No status text",
                browser_error:
                  error instanceof Error ? error.message : "Unknown error type",
              },
            );
          }
        }
      }
    }
  };

  const initializePaystack = async () => {
    if (!fullUserDetails) {
      toast.error("No user found");
      return;
    }

    if (userID) {
      if (event.tickets && !selectedTicket) {
        toast.error("Select a ticket to continue");
        setLoadingPaystack(false);
        setIsLoading(false);
      } else if (
        Number(event.spotTaken) >= Number(event.spot) &&
        !event.isUnlimited
      ) {
        toast.error("Sorry! Event already filled up 😔");
      } else {
        if (showAdditionalEmails) {
          const allEmailsValid = isAdded
            ? additionalEmails.length === numberOfTickets &&
              additionalEmails.every(
                (email) => email.trim() !== "" && isTrustedEmail(email),
              )
            : additionalEmails.length === numberOfTickets - 1 &&
              additionalEmails.every(
                (email) => email.trim() !== "" && isTrustedEmail(email),
              );

          if (!allEmailsValid) {
            toast.error(
              "Please ensure all additional emails are added and valid.",
            );
            return;
          }
        }

        try {
          if (showAdditionalEmails) {
            const isConfirmed = await confirm(
              "Confirm Additional Emails",
              `Are you sure you want to proceed with these additional mails?\n\n${additionalEmails
                .map((email, i) => `Email ${i + 1}: ${email}`)
                .join("\n")}`,
            );
            if (!isConfirmed) {
              return;
            }
          }
          setLoadingPaystack(true);
          const response = await api.post(
            selectedTicket && selectedTicket.price == "0"
              ? "https://troop-node-payment.onrender.com/api/wa/initialize-free-payment"
              : `https://troop-node-payment.onrender.com/api/wa/initialize-payment`,

            selectedTicket
              ? {
                  amount: selectedTicket.price,
                  eventId: id,
                  userId: userID,
                  hostId: event.userID,
                  name: fullUserDetails.name,
                  photoURL: fullUserDetails.photoURL,
                  email: fullUserDetails.email,
                  ticketName: selectedTicket.name,
                  instruction: selectedTicket.instruction || "",
                  referralCode,
                  affiliateCode,
                  numberOfTickets,
                  additionalEmails: showAdditionalEmails
                    ? additionalEmails
                    : [],
                  buyAgainAdditional: showAdditionalEmails && isAdded,
                  country: countries[event.country].code,
                  discount: discount || null,
                  addPercent: selectedTicket.addPercent || false,
                  extraPercent: selectedTicket.extraPercent || 0,
                  ticketPhoneNumber: getNormalizedTicketPhoneNumber(),
                }
              : {
                  amount: event.ticketAmount,
                  eventId: id,
                  userId: userID,
                  hostId: event.userID,
                  name: fullUserDetails.name,
                  photoURL: fullUserDetails.photoURL,
                  email: fullUserDetails.email,
                  referralCode,
                  affiliateCode,
                  ticketPhoneNumber: getNormalizedTicketPhoneNumber(),
                },
          );

          if (selectedTicket && selectedTicket.price == "0") {
            setIsLoading(false);
            setLoadingPaystack(false);
            handleClose();
            toast.success("Ticket Purchase successful 🎉");
            router.push(`/checkout-success/${id}`);
          } else {
            const { authorization_url } = response.data.data;
            try {
              window.location.assign(authorization_url);
            } catch {
              toast.error("Unable to open payment window. Please try again");
            }
          }
        } catch (err) {
          const error = err as AxiosError;
          toast.error(
            error.response &&
              error.response.data &&
              typeof error.response.data === "object" &&
              "message" in error.response.data
              ? String(error.response.data.message)
              : error instanceof Error && error.message == "Network Error"
                ? "Network error. Please confirm your Wi-Fi or mobile data connection and retry."
                : "Something went wrong, Please try again.",
          );
          setIsLoading(false);
          setLoadingPaystack(false);

          // Error Reporting
          if (
            !error.response ||
            !error.response.data ||
            typeof error.response.data !== "object" ||
            !("message" in error.response.data)
          ) {
            await axios.post(
              "https://troop-node-backend.onrender.com/troop-node-otp/send-error-report",
              {
                error_message: `This user - ${userID} wanted to pay with paystack, from the initializePaystack function, but an error occurred.`,
                error_code: error.code || "Unknown Error Code",
                request_url: error.config?.url || "Unknown URL",
                info: error.message || error.toString(),
                status_code: error.response?.status || "No status",
                status_text: error.response?.statusText || "No status text",
                browser_error:
                  error instanceof Error ? error.message : "Unknown error type",
              },
            );
          }
        }
      }
    }
  };

  const isPayPalAvailable =
    !event.isFree &&
    selectedTicket &&
    event?.isPayPalEnabled &&
    Number(selectedTicket?.price || 0) > 0 &&
    (event.country === "United States" || event.country === "Canada");

  const initializePayPal = async () => {
    if (!fullUserDetails || !userID) {
      toast.error("No user found");
      return;
    }
    if (event.tickets && !selectedTicket) {
      toast.error("Select a ticket to continue");
      setLoadingPayPal(false);
      return;
    }
    if (Number(event.spotTaken) >= Number(event.spot) && !event.isUnlimited) {
      toast.error("Sorry! Event is already filled up 😔");
      return;
    }
    if (showAdditionalEmails) {
      const allEmailsValid = isAdded
        ? additionalEmails.length === numberOfTickets &&
          additionalEmails.every(
            (email) => email.trim() !== "" && isTrustedEmail(email),
          )
        : additionalEmails.length === numberOfTickets - 1 &&
          additionalEmails.every(
            (email) => email.trim() !== "" && isTrustedEmail(email),
          );
      if (!allEmailsValid) {
        toast.error("Please ensure all additional emails are added and valid.");
        return;
      }
    }
    try {
      setLoadingPayPal(true);
      const payload = selectedTicket
        ? {
            amount: selectedTicket.price,
            stripeCustomerId: "",
            eventId: id,
            userId: userID,
            hostId: event.userID,
            fullUserDetails: {
              name: fullUserDetails.name,
              photoURL: fullUserDetails.photoURL,
            },
            ticketName: selectedTicket.name,
            instruction: selectedTicket.instruction || "",
            eventName: event.title.trim(),
            referralCode,
            affiliateCode,
            numberOfTickets,
            additionalEmails: showAdditionalEmails ? additionalEmails : [],
            buyAgainAdditional: showAdditionalEmails && isAdded,
            country: countries[event.country].code,
            discount: discount || null,
            addPercent: selectedTicket.addPercent || false,
            extraPercent: selectedTicket.extraPercent || 0,
            ticketPhoneNumber: getNormalizedTicketPhoneNumber(),
          }
        : {
            amount: event.ticketAmount,
            stripeCustomerId: "",
            eventId: id,
            userId: userID,
            hostId: event.userID,
            fullUserDetails: {
              name: fullUserDetails.name,
              photoURL: fullUserDetails.photoURL,
            },
            eventName: event.title.trim(),
            referralCode,
            affiliateCode,
            ticketPhoneNumber: getNormalizedTicketPhoneNumber(),
          };
      const response = await api.post(
        "https://troop-node-payment.onrender.com/api/core/paypal/create-order",
        payload,
      );
      const { approvalUrl } = response.data;
      if (approvalUrl) {
        window.location.assign(approvalUrl);
      } else {
        toast.error("Unable to start PayPal checkout. Please try again.");
        setLoadingPayPal(false);
      }
    } catch (err) {
      const error = err as AxiosError;
      toast.error(
        error.response &&
          error.response.data &&
          typeof error.response.data === "object" &&
          "message" in error.response.data
          ? String(error.response.data.message)
          : error instanceof Error && error.message === "Network Error"
            ? "Network error. Please confirm your Wi-Fi or mobile data connection and retry."
            : "Something went wrong. Please try again.",
      );
      setLoadingPayPal(false);
    }
  };

  const verifyDicountCode = async () => {
    if (!discountCode || discountCode.length < 1) {
      toast.error("Please enter a discount code");
      return;
    }

    setIsVerifyingDiscount(true);

    try {
      const response = await api.post(
        "https://troop-node-payment.onrender.com/api/core/check-discount-code",
        { eventId: id, code: discountCode },
      );

      setDiscount(response.data);
      toast.success("Discount code is valid");
    } catch (err) {
      setDiscount(null);
      const error = err as AxiosError;
      toast.error(
        error.response &&
          error.response.data &&
          typeof error.response.data === "object" &&
          "message" in error.response.data
          ? String(error.response.data.message)
          : error instanceof Error && error.message == "Network Error"
            ? "Network error. Please confirm your Wi-Fi or mobile data connection and retry."
            : "Something went wrong, Please try again.",
      );

      // Error Reporting
      if (
        !error.response ||
        !error.response.data ||
        typeof error.response.data !== "object" ||
        !("message" in error.response.data)
      ) {
        await axios.post(
          "https://troop-node-backend.onrender.com/troop-node-otp/send-error-report",
          {
            error_message: `This user - ${userID} wanted to verify his discount code, from the verifyDicountCode function, but an error occurred.`,
            error_code: error.code || "Unknown Error Code",
            request_url: error.config?.url || "Unknown URL",
            info: error.message || error.toString(),
            status_code: error.response?.status || "No status",
            status_text: error.response?.statusText || "No status text",
            browser_error:
              error instanceof Error ? error.message : "Unknown error type",
          },
        );
      }
    } finally {
      setIsVerifyingDiscount(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "personal":
        return (
          <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium opacity-50"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 p-2 block w-full border border-[--border] bg-[var(--bg-secondary)] rounded-md shadow-sm outline-none disabled:opacity-50"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={isLoading}
                type="submit"
                className="w-full bg-[var(--secondary)] py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-2 justify-center disabled:opacity-50"
                style={{ color: colors.buttonText }}
              >
                {isLoading && <Loader2 size={15} className="animate-spin" />}
                <span style={{ fontSize: 18, padding: 5, fontWeight: "600" }}>
                  Next
                </span>
                <CircleChevronRight size={18} strokeWidth={3} />
              </button>
            </div>
          </form>
        );

      case "otp":
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyOtp();
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium opacity-50"
              >
                Enter OTP
              </label>
              <input
                type="number"
                id="otp"
                placeholder="Enter OTP"
                value={otp}
                maxLength={4}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="mt-1 p-2 block w-full bg-[var(--bg-secondary)] border border-[--border] rounded-md shadow-sm outline-none disabled:opacity-50"
              />
            </div>
            <div
              style={{
                borderRadius: 5,
                backgroundColor: colors.refundBg,
                color: colors.refundText,
              }}
              className=" p-4 mb-5"
            >
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex item-center">
                  <Info className="h-4 w-4 mr-2" />
                  <span className="font-semibold text-sm">
                    {" "}
                    OTP sucks, we know!
                  </span>
                </div>{" "}
              </div>
              <p style={{ fontSize: 14 }}>
                We just sent an OTP to your email to keep your tickets safe and
                easy to recover if lost.{" "}
                <span className="font-bold">
                  This is the only time we’ll ask for an OTP when you buy a
                  ticket.
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep("personal");
                  setIsOtpSent(false);
                  setOtp("");
                }}
                className="bg-[var(--bg-secondary)] border border-[--border] text-[var(--primary)] py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3"
              >
                <CircleChevronLeft size={18} strokeWidth={3} />
                <span style={{ fontSize: 18, padding: 5, fontWeight: "600" }}>
                  Back
                </span>
              </button>
              <button
                disabled={isLoading || otp.length !== 4}
                type="submit"
                className="w-full bg-[var(--secondary)] py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-2 justify-center disabled:opacity-50"
                style={{ color: colors.buttonText }}
              >
                {isLoading && <Loader2 size={15} className="animate-spin" />}
                <span style={{ fontSize: 18, padding: 5, fontWeight: "600" }}>
                  Verify OTP
                </span>
                <CircleChevronRight size={18} strokeWidth={3} />
              </button>
            </div>
            {otpTimer > 0 ? (
              <p className="text-sm text-center">
                Resend OTP in {otpTimer} seconds
              </p>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full mt-2 text-[var(--secondary)] hover:underline font-medium"
              >
                Resend OTP
              </button>
            )}
          </form>
        );

      case "userdetails":
        return (
          <>
            <div className="my-10 mb-5">
              <div className="flex items-center gap-3">
                <img
                  src={
                    fullUserDetails?.photoURL ||
                    "https://firebasestorage.googleapis.com/v0/b/troop-88fe2.appspot.com/o/user%20(1).png?alt=media&token=2365f2c3-2996-4137-bd24-9695dfbbcaa0" ||
                    "/placeholder.svg"
                  }
                  className="w-[40px] h-[40px] bg-[var(--secondary)] rounded-md"
                />
                <div>
                  <p>{fullUserDetails?.name || ""}</p>
                  <p className="text-sm opacity-50">
                    {fullUserDetails?.email || ""}
                  </p>
                </div>
              </div>
            </div>
            {isAdded && event.isFree && (
              <p className="p-3 px-4 font-semibold rounded-md border border-[--border] bg-[var(--bg-secondary)] mb-5">
                {event.requireApproval && event.isFree
                  ? "You are already registered for this event"
                  : "You are already an attendee of this event"}
              </p>
            )}
            {event.collectPhoneNumber && (
              <div className="mb-5">
                <label
                  htmlFor="ticket-phone-number"
                  className="block text-sm font-medium opacity-50"
                >
                  Phone Number
                </label>
                <input
                  id="ticket-phone-number"
                  type="tel"
                  placeholder={
                    event.country === "United States"
                      ? "(555) 123-4567"
                      : "+234 801 234 5678"
                  }
                  value={ticketPhoneNumber}
                  onChange={(e) => setTicketPhoneNumber(e.target.value)}
                  className="mt-1 p-2 block w-full border border-[--border] bg-[var(--bg-secondary)] rounded-md shadow-sm outline-none disabled:opacity-50"
                />
                <p className="text-xs opacity-60 mt-1">
                  This will be visible to the event organizer.
                </p>
              </div>
            )}
            <div
              style={{ marginBottom: 15 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => {
                  setCurrentStep("personal");
                  setFullUserDetails(null);
                  setUserID(null);
                }}
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.primary,
                }}
                className="py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3 border border-[--border]"
              >
                <CircleChevronLeft
                  size={18}
                  style={{ opacity: 0.7 }}
                  color={colors.primary}
                  strokeWidth={3}
                />
                <span
                  style={{
                    fontSize: 18,
                    padding: 5,
                    fontWeight: "600",
                    opacity: 0.7,
                    color: colors.primary,
                  }}
                >
                  Back
                </span>
              </button>
              <button
                disabled={isLoading || isSavingTicketPhoneNumber}
                onClick={async () => {
                  if (
                    event.collectPhoneNumber &&
                    !hasValidTicketPhoneNumber(getNormalizedTicketPhoneNumber())
                  ) {
                    toast.error("Please enter a valid phone number");
                    return;
                  }
                  const canProceed = await persistTicketPhoneNumberIfNeeded();
                  if (!canProceed) {
                    return;
                  }
                  setCurrentStep("payment");
                }}
                className="w-full bg-[var(--secondary)] py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-3 justify-center disabled:opacity-50"
                style={{ color: colors.buttonText }}
              >
                {(isLoading || isSavingTicketPhoneNumber) && (
                  <Loader2 size={15} className="animate-spin" />
                )}{" "}
                <span style={{ fontSize: 18, padding: 5, fontWeight: "600" }}>
                  {isSavingTicketPhoneNumber ? "Saving..." : "Next"}
                </span>
                <CircleChevronRight size={18} strokeWidth={3} />
              </button>
            </div>
          </>
        );
      case "newUser":
        return (
          <form onSubmit={handleNewUser} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium opacity-50"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                placeholder="Kinyi Tega"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 p-2 block w-full bg-[var(--bg-secondary)] border border-[--border] rounded-md shadow-sm outline-none disabled:opacity-50"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <button
                onClick={() => {
                  setCurrentStep("personal");
                }}
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.primary,
                }}
                className="py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3 border border-[--border]"
              >
                <CircleChevronLeft
                  size={18}
                  style={{ opacity: 0.7 }}
                  color={colors.primary}
                  strokeWidth={3}
                />
                <span
                  style={{
                    fontSize: 18,
                    padding: 5,
                    fontWeight: "600",
                    opacity: 0.7,
                    color: colors.primary,
                  }}
                >
                  Back
                </span>
              </button>
              <button
                disabled={isLoading}
                type="submit"
                style={{ marginBottom: 15, color: colors.buttonText }}
                className="w-full bg-[var(--secondary)] py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-1 justify-center disabled:opacity-50"
              >
                {isLoading && <Loader2 size={15} className="animate-spin" />}{" "}
                <span style={{ fontSize: 18, padding: 5, fontWeight: "600" }}>
                  Next
                </span>{" "}
                <CircleChevronRight size={18} strokeWidth={3} />
              </button>
            </div>
          </form>
        );
      case "payment":
        return (
          <div className="space-y-4 ">
            <div className="max-h-[60vh] overflow-y-auto space-y-4 border-b border-b-[--border] pb-3">
              <p className="text-base font-medium">
                {event.isFree && !event.requireApproval
                  ? "Ready to Join this event?"
                  : event.requireApproval && event.isFree
                    ? "Ready to register for this event?"
                    : event.tickets
                      ? "Select a ticket to purchase"
                      : "Ready to complete your purchase?"}
              </p>
              {event.requireApproval && event.isFree && (
                <p className="p-3 bg-[#c4f9e0] text-black border border-[--border] rounded-md text-sm">
                  Once you register for this event and the event organizer
                  approves, your ticket will be sent to your email.
                </p>
              )}
              {event.tickets && (
                <div>
                  {event.tickets.map((ticket, i) => {
                    return (
                      <div
                        key={i}
                        style={{
                          color:
                            selectedTicket == ticket ? colors.buttonText : "",
                        }}
                        className={`flex items-stretch relative  ${
                          ticket.quantity == "sold out" ||
                          ticket.quantity == "0"
                            ? "mt-5"
                            : ""
                        } mb-2 gap-2 cursor-pointer`}
                      >
                        {(ticket.quantity == "sold out" ||
                          ticket.quantity == "0") && (
                          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-[20] ">
                            <div className="bg-gray-500 opacity-70 w-[83%] ml-4 max-md:ml-6 h-[2px] rounded-md"></div>
                          </div>
                        )}
                        <div
                          onClick={() => {
                            if (
                              ticket.quantity == "0" ||
                              ticket.quantity == "sold out"
                            ) {
                              return;
                            }

                            setSelectedTicket(ticket);
                            setNumberOfTickets(Number(ticket.limitMin) ?? 1);
                          }}
                          className={`flex border border-[--border] ${
                            ticket.quantity == "0" ||
                            ticket.quantity == "sold out"
                              ? "opacity-40 cursor-not-allowed"
                              : ""
                          } ${
                            selectedTicket == ticket
                              ? "bg-[var(--secondary)]"
                              : "bg-[var(--bg-secondary)]"
                          } rounded p-2 px-3 flex-1 gap-3 `}
                        >
                          <div>
                            <TicketIcon
                              size={20}
                              style={{
                                transform: "rotate(-30deg)",
                              }}
                            />
                          </div>
                          <p
                            style={{ fontWeight: "500" }}
                            className={`uppercase ${
                              selectedTicket !== ticket && "line-clamp-1"
                            }`}
                          >
                            {ticket.name}
                          </p>
                        </div>
                        <p
                          onClick={() => {
                            if (
                              ticket.quantity == "0" ||
                              ticket.quantity == "sold out"
                            ) {
                              return;
                            }

                            setSelectedTicket(ticket);
                            setNumberOfTickets(Number(ticket.limitMin) ?? 1);
                          }}
                          style={{ fontWeight: "500" }}
                          className={`flex border border-[--border] relative ${
                            ticket.quantity == "0" ||
                            ticket.quantity == "sold out"
                              ? "opacity-40 cursor-not-allowed"
                              : ""
                          } ${
                            selectedTicket == ticket
                              ? "bg-[var(--secondary)]"
                              : "bg-[var(--bg-secondary)]"
                          } p-2 px-3 w-[25%] text-center rounded justify-center items-center `}
                        >
                          {countries[event.country].currency}
                          {(
                            Number(ticket.price) *
                            (selectedTicket === ticket
                              ? numberOfTickets
                              : Number(ticket.limitMin) || 1)
                          ).toLocaleString()}
                        </p>
                        {(ticket.quantity == "0" ||
                          ticket.quantity == "sold out") && (
                          <div className="absolute -top-3 w-full flex items-start justify-end rounded-md">
                            <span className="text-[10px] font-semibold bg-red-500 text-white px-2 py-1 rounded-sm flex items-center gap-2">
                              <Lock className="w-3 h-3" />
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedTicket && (
                <div className="">
                  <span className="text-base font-medium   mt-8">
                    How many tickets do you want to buy?
                  </span>
                  <div className="flex items-center gap-10  my-4 ">
                    <button
                      className="disabled:opacity-50 bg-[var(--bg-secondary)] border border-[--border] p-3 rounded"
                      disabled={
                        numberOfTickets == (selectedTicket.limitMin ?? 1)
                      }
                      onClick={() => {
                        if (numberOfTickets == 2) {
                          setShowAdditionalEmails(false);
                          setAdditionalEmails([]);
                        }

                        setNumberOfTickets((prev) =>
                          Math.max(
                            Number(selectedTicket.limitMin) ?? 1,
                            parseInt(prev.toString(), 10) - 1,
                          ),
                        );
                      }}
                    >
                      <CircleMinus />
                    </button>
                    <div style={{ fontSize: 20 }}>{numberOfTickets}</div>
                    <button
                      className="disabled:opacity-50 bg-[var(--bg-secondary)] border border-[--border] p-3 rounded"
                      disabled={numberOfTickets == (selectedTicket.limit ?? 10)}
                      onClick={() =>
                        setNumberOfTickets((prev: number) =>
                          Math.min(
                            Number(selectedTicket.limit) ?? 10,
                            parseInt(prev.toString(), 10) + 1,
                          ),
                        )
                      }
                    >
                      <CirclePlus />
                    </button>
                  </div>
                </div>
              )}
              {selectedTicket && (numberOfTickets > 1 || isAdded) && (
                <div className="">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 !text-[var(--secondary)] accent-[var(--secondary)]"
                      checked={showAdditionalEmails}
                      onChange={(e) =>
                        setShowAdditionalEmails(e.target.checked)
                      }
                    />
                    <span className="text-sm ">
                      Send tickets to different email addresses?
                    </span>
                  </label>
                  {showAdditionalEmails && (
                    <div className="mt-8 space-y-2">
                      <input
                        type="email"
                        placeholder={`Email for ticket ${
                          isAdded
                            ? currentEmailIndex + 1
                            : currentEmailIndex + 2
                        }`}
                        value={additionalEmails[currentEmailIndex] || ""}
                        onChange={(e) => {
                          const newEmails = [...additionalEmails];
                          newEmails[currentEmailIndex] = e.target.value;
                          setAdditionalEmails(newEmails);
                        }}
                        className="w-full p-2 bg-[var(--bg-secondary)] border border-[--border] rounded text-base"
                      />
                      <div className="flex justify-between mt-2">
                        <button
                          onClick={() =>
                            setCurrentEmailIndex((prev) =>
                              Math.max(0, prev - 1),
                            )
                          }
                          disabled={currentEmailIndex === 0}
                          className="flex font-bold items-center px-4 py-2 bg-[var(--bg-secondary)] border border-[--border] rounded disabled:opacity-50 text-sm"
                        >
                          <ChevronLeft className="mr-2" />
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setCurrentEmailIndex((prev) =>
                              Math.min(
                                isAdded
                                  ? numberOfTickets - 1
                                  : numberOfTickets - 2,
                                prev + 1,
                              ),
                            )
                          }
                          disabled={
                            isAdded
                              ? currentEmailIndex === numberOfTickets - 1
                              : currentEmailIndex === numberOfTickets - 2
                          }
                          className="flex font-bold items-center px-4 py-2 bg-[var(--bg-secondary)] border border-[--border] rounded disabled:opacity-50 text-sm"
                        >
                          Next
                          <ChevronRight className="ml-2" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {event.referrals && (
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium opacity-50 mt-8"
                  >
                    Referral Code <span className="text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="OL9X1ER4"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    required
                    className="mt-1 p-2 block w-full bg-[var(--bg-secondary)] border border-[--border] rounded-md shadow-sm outline-none disabled:opacity-50"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 max-md:flex-col max-md:gap-3 max-md:items-start">
              <button
                onClick={() => {
                  setCurrentStep("userdetails");
                }}
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.primary,
                }}
                className="py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3 border border-[--border]"
              >
                <CircleChevronLeft
                  size={18}
                  style={{ opacity: 0.7 }}
                  color={colors.primary}
                  strokeWidth={3}
                />
                <span
                  style={{
                    fontSize: 18,
                    padding: 5,
                    fontWeight: "600",
                    opacity: 0.7,
                    color: colors.primary,
                  }}
                >
                  Back
                </span>
              </button>
              <div className="w-full">
                <button
                  disabled={
                    isLoading ||
                    loadingPayPal ||
                    (!selectedTicket && !event.isFree)
                  }
                  onClick={() => {
                    if (event.isFree) {
                      handleIncrement();
                      return;
                    }

                    if (showAdditionalEmails) {
                      const allEmailsValid = isAdded
                        ? additionalEmails.length === numberOfTickets &&
                          additionalEmails.every(
                            (email) =>
                              email.trim() !== "" && isTrustedEmail(email),
                          )
                        : additionalEmails.length === numberOfTickets - 1 &&
                          additionalEmails.every(
                            (email) =>
                              email.trim() !== "" && isTrustedEmail(email),
                          );

                      if (!allEmailsValid) {
                        toast.error(
                          "Please ensure all additional emails are added and valid.",
                        );
                        return;
                      }
                    }
                    setCurrentStep("summary");
                  }}
                  className="w-full bg-[var(--secondary)] py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-3 justify-center disabled:opacity-50"
                  style={{ color: colors.buttonText }}
                >
                  {!event.isFree ? null : <Plus strokeWidth={3} size={18} />}
                  <span style={{ fontSize: 17, padding: 4, fontWeight: "600" }}>
                    {event.isFree
                      ? event.requireApproval
                        ? "Register"
                        : "Join"
                      : "Continue"}
                  </span>
                  {(isLoading ||
                    loadingPaystack ||
                    loadingStripe ||
                    loadingPayPal) && (
                    <Loader2 size={15} className="animate-spin" />
                  )}{" "}
                </button>
                {isPayPalAvailable && (
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={
                        isLoading ||
                        isVerifyingDiscount ||
                        loadingPaystack ||
                        loadingStripe ||
                        loadingPayPal
                      }
                      onClick={initializePayPal}
                      className="w-full py-2.5 px-4 rounded-md text-sm flex items-center gap-3 justify-center disabled:opacity-50 border border-[#0070ba] bg-[#0070ba] text-white hover:opacity-90"
                    >
                      {loadingPayPal ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <BsPaypal size={18} />
                      )}
                      <span
                        className=""
                        style={{ fontSize: 18, fontWeight: "600" }}
                      >
                        Pay with PayPal
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "summary":
        const ticketPrice = Number(selectedTicket?.price || 0);

        const normalPrice =
          selectedTicket && ticketPrice > 0 ? ticketPrice * numberOfTickets : 0;

        const extraFee =
          selectedTicket &&
          selectedTicket.extraPercent != null &&
          selectedTicket.extraPercent > 0
            ? (selectedTicket.extraPercent || 0) * numberOfTickets
            : 0;

        const troopFee = selectedTicket?.addPercent
          ? normalPrice * 0.05 + getFee(event.country)
          : 0;

        const subTotal = normalPrice + extraFee + troopFee;

        // DISCOUNT LOGIC
        const discountPercent = Number(discount?.discountPercentage || 0);

        const discountedNormal = discount
          ? normalPrice * ((100 - discountPercent) / 100)
          : normalPrice;

        const discountedExtra = discount
          ? extraFee * ((100 - discountPercent) / 100)
          : extraFee;

        const discountedSubtotal = discount
          ? discountedNormal + discountedExtra + troopFee
          : subTotal;

        const finalPayable = discountedSubtotal;

        return (
          <div className="space-y-4 ">
            <div className="max-h-[50vh] overflow-y-auto space-y-4 border-b border-b-[--border] pb-3">
              <p className="text-base font-medium">Purchase Summary</p>
              <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-[--border] divide-dashed dash pb-4">
                <span className="flex items-center gap-1 text-sm">
                  <span>{numberOfTickets}</span> <X size={13} />{" "}
                  <span className="opacity-60">
                    {selectedTicket?.name} Ticket
                  </span>
                </span>
                <span className="font-semibold">
                  {countries[event.country].currency}
                  {normalPrice.toLocaleString()}
                </span>
              </div>

              {((selectedTicket &&
                selectedTicket?.addPercent &&
                ticketPrice !== 0) ||
                (selectedTicket &&
                  selectedTicket.extraPercent &&
                  selectedTicket.extraPercent > 0 &&
                  ticketPrice !== 0)) && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span>Fees</span>
                    <span className="opacity-60 text-xs">
                      Non Refundable Fee
                    </span>
                  </div>
                  <span className="font-semibold">
                    {countries[event.country].currency}
                    {(troopFee + extraFee).toLocaleString()}
                  </span>
                </div>
              )}

              {ticketPrice !== 0 && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span>Subtotal</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-[--secondary] font-semibold ${
                        discount ? "line-through opacity-50" : ""
                      }`}
                    >
                      {countries[event.country].currency}
                      {subTotal.toLocaleString()}
                    </span>
                    {discount && (
                      <span className="text-[--secondary] font-semibold">
                        {countries[event.country].currency}
                        {discountedSubtotal.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {event.hasDiscount && Number(selectedTicket?.price) !== 0 && (
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium opacity-50 mt-8"
                  >
                    Discount Code <span className="text-xs">(optional)</span>
                  </label>
                  <div className="flex items-center gap-2 mt-1 ">
                    <div className="flex-1 relative flex items-center ">
                      <input
                        type="text"
                        id="name"
                        placeholder="ESWSX2HSE"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        required
                        className="p-2 block w-full bg-[var(--bg-secondary)] border border-[--border] rounded-md shadow-sm outline-none disabled:opacity-50"
                      />
                      {discount && (
                        <CheckCircle
                          strokeWidth={2}
                          className="text-[--secondary] w-4 h-4 absolute right-3 z-[10]"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={isVerifyingDiscount}
                      onClick={() => {
                        if (discount) {
                          setDiscount(null);
                          setDiscountCode("");
                        } else {
                          verifyDicountCode();
                        }
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50 ${
                        !discount
                          ? "bg-[--secondary] text-black "
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {isVerifyingDiscount ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : discount ? (
                        "Remove"
                      ) : (
                        "Verify"
                      )}
                    </button>
                  </div>
                  {discount && (
                    <div className="mt-2 flex items-center gap-2 pb-5">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-[--secondary]">
                          {countries[event.country].currency}
                          {discountedSubtotal.toLocaleString()}
                        </span>
                        <span className="text-sm line-through opacity-50">
                          {countries[event.country].currency}
                          {subTotal.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs bg-[--secondary] text-black px-2 py-0.5 rounded-full">
                        {String(discount.discountPercentage)}% OFF
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {event.refundPolicy && (
              <div
                className="p-3 border border-[--border] rounded-md text-sm"
                style={{
                  backgroundColor: colors.refundBg,
                  color: colors.refundText,
                }}
              >
                <p className="text-sm font-semibold">Event Refund Policy</p>
                <p>{event.refundPolicy}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentStep("payment");
                }}
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.primary,
                }}
                className="py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3 border border-[--border]"
              >
                <CircleChevronLeft
                  size={18}
                  style={{ opacity: 0.7 }}
                  color={colors.primary}
                  strokeWidth={3}
                />
                <span
                  style={{
                    fontSize: 18,
                    padding: 5,
                    fontWeight: "600",
                    opacity: 0.7,
                    color: colors.primary,
                  }}
                >
                  Back
                </span>
              </button>
              <button
                disabled={
                  isLoading ||
                  isVerifyingDiscount ||
                  loadingPaystack ||
                  loadingStripe ||
                  loadingPayPal ||
                  (!event.isFree && !selectedTicket)
                }
                onClick={() => {
                  if (event.isFree) {
                    handleIncrement();
                  } else {
                    countries[event.country].payment === "paystack"
                      ? initializePaystack()
                      : initializeStripe();
                  }
                }}
                className="w-full bg-[var(--secondary)] py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-3 justify-center disabled:opacity-50"
                style={{ color: colors.buttonText }}
              >
                {!event.isFree ? null : <Plus strokeWidth={3} size={18} />}
                <span style={{ fontSize: 18, padding: 4, fontWeight: "600" }}>
                  {event.isFree
                    ? "Join"
                    : !selectedTicket
                      ? "Pay Now"
                      : ticketPrice === 0
                        ? "Get Ticket"
                        : `Pay ${
                            countries[event.country].currency
                          }${finalPayable.toLocaleString()} Now`}
                </span>
                {(isLoading ||
                  loadingPaystack ||
                  loadingStripe ||
                  loadingPayPal) && (
                  <Loader2 size={15} className="animate-spin" />
                )}{" "}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="!font-[poppins]" style={{ color: colors.primary }}>
      {isOpen && (
        <div className="fixed z-[99999999] inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div
            ref={modalRef}
            className="bg-[var(--bg-primary)] rounded-lg shadow-xl p-6 w-full max-w-md"
            style={
              {
                "--primary": colors.primary,
                "--secondary": colors.secondary,
                "--bg-primary": colors.bgPrimary,
                "--bg-secondary": colors.bgSecondary,
                "--border": colors.border,
              } as React.CSSProperties
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              className="pb-3"
            >
              <h2
                className="text-xl font-bold mb-4"
                style={{ color: colors.primary }}
              >
                {event.isFree
                  ? event.requireApproval
                    ? "Register for Event"
                    : "Join Event"
                  : "Buy Ticket"}
              </h2>{" "}
              <button
                onClick={handleClose}
                className="text-sm border border-[--border]"
                style={{
                  backgroundColor: colors.bgSecondary,
                  marginBottom: 20,
                  padding: 5,
                  borderRadius: 100,
                  color: colors.primary,
                }}
              >
                <X
                  size={18}
                  strokeWidth={3}
                  style={{ color: colors.primary, fontWeight: "bold" }}
                />
              </button>
            </div>
            {Date.now() > event.endTime ? (
              <p className="p-3 px-4 font-semibold rounded-md bg-[var(--bg-secondary)] border border-[--border]">
                This event has ended
              </p>
            ) : (
              <>
                <div className="flex justify-between mb-6 gap-4">
                  {steps.map((step) => (
                    <div
                      key={step}
                      className={`flex-1 h-2 rounded-full ${
                        currentStep === step
                          ? "bg-[var(--secondary)]"
                          : "bg-[var(--primary)] opacity-10"
                      }`}
                    />
                  ))}
                </div>
                {Number(event.spotTaken) >= Number(event.spot) &&
                  !event.isUnlimited && (
                    <p className="p-3 mb-2 px-4 font-semibold rounded-md bg-[var(--bg-secondary)]">
                      Sorry, this event is already filled up!
                    </p>
                  )}
                {isAdded && event.isFree ? (
                  <>
                    <p className="p-3 px-4 font-semibold rounded-md bg-[var(--bg-secondary)] border border-[--border]">
                      {event.requireApproval && event.isFree
                        ? "You are already registered for this event"
                        : "You are already an attendee of this event"}
                    </p>
                    {fullUserDetails && (
                      <button
                        onClick={() => {
                          setCurrentStep("personal");
                          setFullUserDetails(null);
                          setUserID(null);
                        }}
                        className="w-full bg-[var(--secondary)] py-2 px-4 rounded-md hover:md:opacity-50 text-sm mt-3 flex items-center justify-center gap-1"
                        style={{ color: colors.buttonText }}
                      >
                        <CircleChevronLeft
                          size={18}
                          style={{ opacity: 0.7 }}
                          color={colors.buttonText}
                          strokeWidth={3}
                        />
                        <span
                          style={{
                            fontSize: 18,
                            padding: 5,
                            fontWeight: "600",
                            opacity: 0.7,
                            color: "black",
                          }}
                        >
                          Back
                        </span>
                      </button>
                    )}
                  </>
                ) : (
                  renderStep()
                )}
              </>
            )}
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isConfirmOpen}
        modalColors={modalColors}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Confirm Email"
        message={
          <>
            {" "}
            Are you sure you want to continue with this email,
            <span className="font-bold"> {email} </span>, tickets will be sent
            to it once you purchase?.
          </>
        }
      />
      <ConfirmComponent />
      <InvalidEmail
        isOpen={showInvalidEmail}
        onClose={() => setShowInvalidEmail(false)}
        modalColors={modalColors}
      />

      <OtpModal
        isLoading={isLoading}
        isOpen={isOtpFreeOpen}
        onClose={() => setIsOtpFreeOpen(false)}
        onVerify={handleVerifyOtpFree}
        otpTimer={otpTimer}
        modalColors={modalColors}
        handleSendOtp={handleSendOtpFree}
      />
      {showEmailUpdateModal && (
        <EmailUpdateModal
          isOpen={showEmailUpdateModal}
          onClose={() => setShowEmailUpdateModal(false)}
          onUpdateEmail={handleUpdateEmail}
          modalColors={modalColors}
        />
      )}
    </div>
  );
}
