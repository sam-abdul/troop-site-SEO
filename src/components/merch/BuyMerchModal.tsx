import { useState, useEffect, useRef } from "react";
import axios, { AxiosError } from "axios";
import {
  formatDate,
  formatTime,
  generateRandomPassword,
  getFee,
  getFeeString,
  isTrustedEmail,
} from "../../utils/helper";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  CircleChevronLeft,
  CircleChevronRight,
  Info,
  Loader,
  Loader2,
  X,
  MapPin,
  ExternalLink,
  Trash2,
} from "lucide-react";
import ConfirmModal from "../ConfirmModal";
import { countries } from "../../utils/countries";
import { type MerchItem, type VariantOption } from "../../types/merch";
import { type UserDetails } from "../../types/user";
import OtpModal from "../OTPModal";
import EmailUpdateModal from "../EmailUpdateModal";
import InvalidEmail from "../InvalidEmail";
import useConfirm from "../CustomConfirm";
import api from "../../utils/apiClient";
import { Autocomplete } from "@react-google-maps/api";

interface BuyMerchModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  merchItem: MerchItem;
  selectedVariants: VariantOption[];
  quantity: number;
  modalColors?: {
    primary?: string;
    secondary?: string;
    bgPrimary?: string;
    bgSecondary?: string;
    border?: string;
    buttonText?: string;
    noteBg?: string;
    noteText?: string;
  };
}

export default function BuyMerchModal({
  isOpen,
  setIsOpen,
  merchItem,
  selectedVariants,
  quantity,
  modalColors,
}: BuyMerchModalProps) {
  // Default colors
  const colors = {
    primary: modalColors?.primary || "#ffffff",
    secondary: modalColors?.secondary || "#49DD96",
    bgPrimary: modalColors?.bgPrimary || "#121622",
    bgSecondary: modalColors?.bgSecondary || "#1B2030",
    border: modalColors?.border || "rgba(255, 255, 255, 0.05)",
    buttonText: modalColors?.buttonText || "#000000",
    noteBg: modalColors?.noteBg || "#c4f9e0",
    noteText: modalColors?.noteText || "#000000",
  };

  const {
    eventUserID: userID,
    eventFullUserDetails: fullUserDetails,
    setEventFullUserDetails: setFullUserDetails,
    setEventUserID: setUserID,
  } = useAuth();
  const { ConfirmComponent } = useConfirm();
  const [currentStep, setCurrentStep] = useState("personal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<
    "pickup" | "delivery" | ""
  >("");

  const [stepCount, setStepCount] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isOtpFreeOpen, setIsOtpFreeOpen] = useState(false);
  const [showInvalidEmail, setShowInvalidEmail] = useState(false);
  const [showEmailUpdateModal, setShowEmailUpdateModal] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingPaystack, setLoadingPaystack] = useState(false);
  const [pickUpPhone, setPickUpPhone] = useState(
    fullUserDetails?.phoneNumber?.[1] || "",
  );

  const [billingDetails, setBillingDetails] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phoneNumber: fullUserDetails?.phoneNumber?.[1] || "",
    country: merchItem.country,
    placeURL: "",
    lat: 0,
    lng: 0,
  });
  const [billingId, setBillingId] = useState<string>("");
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [savedBillingAddresses, setSavedBillingAddresses] = useState<any[]>([]);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<
    string | null
  >(null);
  const [_, setShowBillingAddresses] = useState(false);
  const [note, setNote] = useState("");

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [creatorEvents, setCreatorEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();

      if (!place.place_id || !place.geometry || !place.geometry.location)
        return;

      const placeInfo = {
        address: place.formatted_address || "",
        country: "",
        state: "",
        city: "",
        zipCode: "",
        placeURL: place.url || "",
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      (place.address_components || []).forEach((component) => {
        const types = component.types;
        if (types.includes("country")) {
          placeInfo.country = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          placeInfo.state = component.long_name;
        }
        if (types.includes("locality") || types.includes("sublocality")) {
          placeInfo.city = component.long_name;
        }
        if (types.includes("postal_code")) {
          placeInfo.zipCode = component.long_name;
        }
      });

      setBillingDetails((prev) => ({
        ...prev,
        ...placeInfo,
      }));
    }
  };

  const saveBillingAddress = async () => {
    if (!userID) return;

    setIsLoadingBilling(true);
    try {
      if (selectedBillingAddress && billingId) {
        const response = await api.put(
          `https://troop-node-dashboard.onrender.com/api/ticket-auth/billing-address/${billingId}`,
          {
            userId: userID,
            address: billingDetails.address,
            city: billingDetails.city,
            state: billingDetails.state,
            zipCode: billingDetails.zipCode,
            phoneNumber: billingDetails.phoneNumber,
            country: billingDetails.country,
            placeURL: billingDetails.placeURL,
            lat: billingDetails.lat,
            lng: billingDetails.lng,
          },
        );

        if (response.data.success) {
          toast.success("Delivery address updated successfully");
          await fetchBillingAddresses();
          return true;
        } else {
          toast.error("Failed to update delivery address");
          return false;
        }
      } else {
        const response = await api.post(
          "https://troop-node-dashboard.onrender.com/api/ticket-auth/billing-address",
          {
            userId: userID,
            address: billingDetails.address,
            city: billingDetails.city,
            state: billingDetails.state,
            zipCode: billingDetails.zipCode,
            phoneNumber: billingDetails.phoneNumber,
            country: billingDetails.country,
            placeURL: billingDetails.placeURL,
            lat: billingDetails.lat,
            lng: billingDetails.lng,
          },
        );

        if (response.data.success) {
          setBillingId(response.data.billingId);
          toast.success("Delivery address saved successfully");
          await fetchBillingAddresses();
          return true;
        } else {
          toast.error("Failed to save delivery address");
          return false;
        }
      }
    } catch (error) {
      console.error("Error saving delivery address:", error);
      if (
        error instanceof AxiosError &&
        error.response?.data?.error?.includes("Maximum of 3 delivery addresses")
      ) {
        toast.error(
          "You can only save up to 3 delivery addresses. Please delete one first.",
        );
      } else {
        toast.error("Failed to save delivery address");
      }
      return false;
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const fetchBillingAddresses = async () => {
    if (!userID) return;

    setIsLoadingBilling(true);
    try {
      const response = await api.get(
        `https://troop-node-dashboard.onrender.com/api/ticket-auth/billing-address/${userID}`,
      );

      if (response.data.success) {
        setSavedBillingAddresses(response.data.addresses || []);

        if (response.data.addresses && response.data.addresses.length > 0) {
          setShowBillingAddresses(true);
        }
      }
    } catch (error) {
      console.error("Error fetching delivery addresses:", error);
      if (error instanceof Error && !error.message.includes("404")) {
        toast.error("Failed to load delivery addresses");
      } else {
        if (deliveryOption === "delivery") {
          toast("Enter delivery address to continue");
        }
        setBillingDetails({
          ...billingDetails,
          country: merchItem.country,
          phoneNumber: fullUserDetails?.phoneNumber?.[1] || "",
        });
      }
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const selectBillingAddress = (address: any) => {
    setBillingDetails({
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      phoneNumber: address.phoneNumber,
      country: address.country,
      placeURL: address.placeURL || "",
      lat: address.lat || 0,
      lng: address.lng || 0,
    });
    setBillingId(address.id);
    setSelectedBillingAddress(address.id);
    setShowBillingAddresses(false);
  };

  const deleteBillingAddress = async (addressId: string) => {
    const toastId = toast.loading("Deleting delivery address...");
    try {
      const response = await api.delete(
        `https://troop-node-dashboard.onrender.com/api/ticket-auth/billing-address/${addressId}`,
        {
          data: { userId: userID },
        },
      );

      if (response.data.success) {
        setSavedBillingAddresses((prev) =>
          prev.filter((addr) => addr.id !== addressId),
        );
        toast.success("Delivery address deleted successfully", { id: toastId });

        if (selectedBillingAddress === addressId) {
          setSelectedBillingAddress(null);
          setBillingId("");
          setBillingDetails({
            address: "",
            city: "",
            state: "",
            zipCode: "",
            phoneNumber: fullUserDetails?.phoneNumber?.[1] || "",
            country: merchItem.country,
            placeURL: "",
            lat: 0,
            lng: 0,
          });
        }
      } else {
        toast.error("Failed to delete delivery address", { id: toastId });
      }
    } catch (error) {
      console.error("Error deleting delivery address:", error);
      toast.error("Failed to delete delivery address", { id: toastId });
    }
  };

  const checkUserExists = async (email: string) => {
    try {
      const response = await api.post(
        "https://troop-node-dashboard.onrender.com/api/ticket-auth/auth/signin",
        {
          email,
        },
      );
      setFullUserDetails(response.data.userData);
      setUserID(response.data.userId);

      if (response.data.userData.canReceiveEmail) {
        return true;
      } else if (
        response.data.userData &&
        (!response.data.userData.canReceiveEmail ||
          response.data.userData.canReceiveEmail == false)
      ) {
        return "unverified";
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

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
    }
  };

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      await axios.post(
        "https://troop-node-backend.onrender.com/troop-node-otp/send-otp",
        {
          email,
          userId: merchItem.userID,
        },
      );
      setCurrentStep("otp");
      setIsOtpSent(true);
      setOtpTimer(30);
      toast.success("OTP sent successfully");
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

  const fetchCreatorEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await api.get(
        `https://troop-node-dashboard.onrender.com/api/ticket-auth/events/user/${merchItem.userID}`,
      );

      if (response.data.success) {
        const upcomingEvents = response.data.data;
        setCreatorEvents(upcomingEvents);
      }
    } catch (error) {
      console.error("Error fetching creator events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setUserID(null);
    setFullUserDetails(null);
    setCurrentStep("personal");
    setIsOtpSent(false);
    setOtp("");
    setOtpTimer(0);
    setBillingDetails({
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phoneNumber: "",
      country: "",
      placeURL: "",
      lat: 0,
      lng: 0,
    });
    setBillingId("");
    setNote("");
    setDeliveryOption("delivery");
    setEmail("");
    setSelectedEvent(null);
    setCreatorEvents([]);
  };

  const handlePersonalInfoSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setBillingDetails({
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phoneNumber: "",
      country: "",
      placeURL: "",
      lat: 0,
      lng: 0,
    });
    setBillingId("");
    setSelectedEvent(null);
    setSavedBillingAddresses([]);
    setSelectedBillingAddress(null);
    setDeliveryOption("");
    if (!isTrustedEmail(email)) {
      toast.error("Please enter a valid email");
      setShowInvalidEmail(true);
    } else {
      try {
        setIsLoading(true);
        const userExists = await checkUserExists(email);

        if (userExists == true) {
          setCurrentStep("userdetails");
          setIsLoading(false);
        } else if (userExists == "unverified") {
          setShowEmailUpdateModal(true);
        } else {
          await handleSendOtp();
        }
      } catch (error) {
        toast.error(
          error instanceof Error && error.message == "Network Error"
            ? "Network error. Please confirm your Wi-Fi or mobile data connection and retry."
            : "An error occurred. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
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
    }
  };

  const initializeStripe = async () => {
    if (!fullUserDetails) {
      toast.error("No user found");
      return;
    }

    if (userID) {
      try {
        setLoadingStripe(true);

        let customerId = fullUserDetails.customerId || null;

        if (!customerId) {
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
          `https://troop-node-payment.onrender.com/api/core/checkout-session-for-merch`,
          {
            amount: merchItem.price.toString(),
            stripeCustomerId: customerId,
            merchId: merchItem.id,
            userId: userID,
            name: fullUserDetails.name,
            photoURL: fullUserDetails.photoURL,
            quantity,
            selectedVariants,
            billingId,
            note,
            deliveryOption,
            eventId: deliveryOption === "pickup" ? selectedEvent.id : "",
            pickUpPhone,
          },
        );

        const { session_url } = response.data;

        try {
          window.location.assign(session_url);
        } catch (error) {
          toast.error("Unable to open payment window. Please try again");
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
      }
    }
  };

  const initializePaystack = async () => {
    if (!fullUserDetails) {
      toast.error("No user found");
      return;
    }

    if (userID) {
      try {
        setLoadingPaystack(true);
        const response = await api.post(
          `https://troop-node-payment.onrender.com/api/wa/initialize-merch-payment`,
          {
            amount: merchItem.price.toString(),
            merchId: merchItem.id,
            userId: userID,
            name: fullUserDetails.name,
            photoURL: fullUserDetails.photoURL,
            email: fullUserDetails.email,
            quantity,
            selectedVariants,
            billingId,
            note,
            deliveryOption,
            eventId: deliveryOption === "pickup" ? selectedEvent.id : "",
            pickUpPhone,
          },
        );

        const { authorization_url } = response.data.data;
        try {
          window.location.assign(authorization_url);
        } catch {
          toast.error("Unable to open payment window. Please try again");
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
      }
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
              style={{ borderRadius: 5 }}
              className="bg-[#c4f9e0] text-black p-4 mb-5"
            >
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex item-center">
                  <Info className="h-4 w-4 mr-2" />
                  <span className="font-semibold text-sm">
                    OTP sucks, we know!
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 14 }}>
                We just sent an OTP to your email to keep your purchase safe and
                easy to recover if lost.{" "}
                <span className="font-bold">
                  This is the only time we'll ask for an OTP when you buy merch.
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
            <div
              style={{ marginBottom: 15 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => {
                  setCurrentStep("personal");
                  setFullUserDetails(null);
                  setUserID(null);
                  setStepCount(0);
                }}
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.buttonText,
                }}
                className=" py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3 border border-[--border]"
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
                onClick={() => {
                  setCurrentStep("delivery");
                  setStepCount(1);
                }}
                className="w-full py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-3 justify-center disabled:opacity-50"
                style={{
                  color: colors.buttonText,
                  backgroundColor: colors.secondary,
                }}
              >
                {isLoading && <Loader2 size={15} className="animate-spin" />}{" "}
                <span style={{ fontSize: 18, padding: 5, fontWeight: "600" }}>
                  Next
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
                  color: colors.buttonText,
                }}
                className=" py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3 border border-[--border]"
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
                className="w-full py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-1 justify-center disabled:opacity-50"
                style={{
                  color: colors.buttonText,
                  backgroundColor: colors.secondary,
                  marginBottom: "15px",
                }}
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

      case "delivery":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Delivery Options</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="pickup"
                    name="deliveryOption"
                    value="pickup"
                    checked={deliveryOption === "pickup"}
                    onChange={(e) => {
                      setDeliveryOption(e.target.value as "pickup");
                      setBillingDetails({
                        address: "",
                        city: "",
                        state: "",
                        zipCode: "",
                        phoneNumber: "",
                        country: "",
                        placeURL: "",
                        lat: 0,
                        lng: 0,
                      });
                      setBillingId("");
                      setSelectedBillingAddress(null);
                      if (
                        e.target.value === "pickup" &&
                        creatorEvents.length === 0
                      ) {
                        fetchCreatorEvents();
                      }
                    }}
                    className="w-4 h-4 text-[var(--secondary)] bg-[var(--bg-secondary)] border-[--border] focus:ring-[var(--secondary)] accent-[var(--secondary)]"
                  />
                  <label
                    htmlFor="pickup"
                    className="text-sm font-medium cursor-pointer"
                  >
                    <div className="font-semibold">Pick up at event</div>
                    <div className="text-xs opacity-70">
                      Pick up at one of the organizer's upcoming events
                    </div>
                  </label>
                </div>
                {deliveryOption === "pickup" && (
                  <div className="space-y-4">
                    <h4 className="text-base font-semibold">
                      Select Event for Pickup
                    </h4>
                    {loadingEvents ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="animate-spin w-4 h-4" />
                        <span className="ml-2 text-sm">Loading events...</span>
                      </div>
                    ) : creatorEvents.length === 0 ? (
                      <div className="text-center py-8 text-sm opacity-70">
                        No upcoming events available for pickup
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {creatorEvents.map((event) => (
                          <div
                            key={event.id}
                            style={{
                              borderColor:
                                selectedEvent?.id === event.id
                                  ? colors.secondary
                                  : "var(--border)",
                              backgroundColor:
                                selectedEvent?.id === event.id
                                  ? `${colors.secondary}10`
                                  : "transparent",
                            }}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors`}
                            onClick={() => {
                              setSelectedEvent(event);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img
                                  src={event.imageUrl}
                                  alt={event.title}
                                  className="w-12 h-12 rounded-md"
                                />
                                <div>
                                  <h5 className="font-semibold text-sm">
                                    {event.title}
                                  </h5>
                                  <p className="text-xs opacity-70">
                                    {event.theme}
                                  </p>
                                  <p className="text-xs opacity-70">
                                    {formatDate(event.date, false)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="delivery"
                    name="deliveryOption"
                    value="delivery"
                    checked={deliveryOption === "delivery"}
                    onChange={(e) => {
                      setDeliveryOption(e.target.value as "delivery");
                      setSelectedEvent(null);

                      fetchBillingAddresses();
                    }}
                    className="w-4 h-4 text-[var(--secondary)] bg-[var(--bg-secondary)] border-[--border] focus:ring-[var(--secondary)] accent-[var(--secondary)]"
                  />
                  <label
                    htmlFor="delivery"
                    className="text-sm font-medium cursor-pointer"
                  >
                    <div className="font-semibold">Delivery to Doorstep</div>
                    <div className="text-xs opacity-70">
                      Package will be delivered to your address
                    </div>
                  </label>
                </div>
                {deliveryOption == "delivery" && (
                  <div className="max-h-[60vh] overflow-y-auto space-y-4 border-b border-b-[--border] pb-3">
                    <hr className="border-t border-t-[--border] my-4" />
                    <div className="relative">
                      {isLoadingBilling && (
                        <div className="absolute top-0 left-0 w-full h-full z-10 flex flex-col items-center justify-center gap-3">
                          <Loader
                            size={20}
                            className="animate-spin w-6 h-6 text-[var(--secondary)]"
                          />
                          <p className="text-sm">Loading delivery address...</p>
                        </div>
                      )}

                      <div
                        className={`grid grid-cols-1 gap-4 ${
                          isLoadingBilling && "opacity-30"
                        }`}
                      >
                        <div>
                          <label className="block text-sm font-medium opacity-50 mb-1">
                            Address
                          </label>
                          <div className="relative">
                            <MapPin
                              size={20}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)] opacity-60"
                            />
                            <Autocomplete
                              onLoad={(autocomplete) => {
                                autocompleteRef.current = autocomplete;
                              }}
                              options={{
                                componentRestrictions: {
                                  country: ["us", "ca", "gh", "ng"],
                                },
                              }}
                            >
                              <input
                                ref={inputRef}
                                type="text"
                                placeholder="1050 Hobbit Street..."
                                value={billingDetails.address}
                                onBlur={() => {
                                  document.body.style.overflow = "auto";
                                }}
                                onFocus={() => {
                                  document.body.style.overflow = "hidden";
                                }}
                                onChange={(e) => {
                                  setBillingDetails({
                                    ...billingDetails,
                                    address: e.target.value,
                                    city: "",
                                    state: "",
                                    zipCode: "",
                                    country: "",
                                    placeURL: "",
                                    lat: 0,
                                    lng: 0,
                                  });
                                }}
                                required
                                className="w-full p-2 pl-10 bg-[var(--bg-secondary)] border border-[--border] rounded-md text-base"
                                autoFocus
                              />
                            </Autocomplete>
                          </div>
                        </div>

                        {savedBillingAddresses.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-[var(--primary)]">
                              Select from saved addresses:
                            </p>
                            <div className="space-y-2">
                              {savedBillingAddresses.map((address, _) => (
                                <div
                                  key={address.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors bg-[var(--bg-secondary)] ${
                                    selectedBillingAddress === address.id
                                      ? "border-[var(--secondary)] bg-[var(--secondary)]/10"
                                      : "border-[var(--border)] hover:border-[var(--secondary)]/50"
                                  }`}
                                  onClick={() => selectBillingAddress(address)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-sm line-clamp-1">
                                        {address.address}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {selectedBillingAddress ===
                                        address.id && (
                                        <div className="w-4 h-4 bg-[var(--secondary)] rounded-full flex items-center justify-center">
                                          <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteBillingAddress(address.id);
                                        }}
                                        className="text-red-500 hover:text-red-700 text-xs"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* <button
                              onClick={() => {
                                setShowBillingAddresses(false);
                                setSelectedBillingAddress(null);
                                setBillingDetails({
                                  ...billingDetails,
                                  address: "",
                                  city: "",
                                  state: "",
                                  zipCode: "",
                                  phoneNumber:
                                    fullUserDetails?.phoneNumber?.[1] || "",
                                  country: merchItem.country,
                                  placeURL: "",
                                  lat: 0,
                                  lng: 0,
                                });
                              }}
                              className="text-sm text-[var(--secondary)] hover:underline"
                            >
                              Enter new address instead
                            </button> */}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCurrentStep("userdetails");
                  setStepCount(0);
                }}
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.buttonText,
                }}
                className=" py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3 border border-[--border]"
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
                onClick={() => {
                  if (deliveryOption === "pickup" && !selectedEvent) {
                    toast.error("Please select an event for pickup");
                    return;
                  }
                  if (deliveryOption === "delivery") {
                    setCurrentStep("billing");
                  } else {
                    setCurrentStep("billing");
                  }

                  setStepCount(2);
                }}
                style={{
                  color: colors.buttonText,
                  backgroundColor: colors.secondary,
                }}
                disabled={
                  (deliveryOption === "pickup" && !selectedEvent) ||
                  (deliveryOption === "delivery" &&
                    (!billingDetails.address || !billingDetails.placeURL))
                }
                className="w-full  py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-3 justify-center disabled:opacity-50"
              >
                <span style={{ fontSize: 18, padding: 5, fontWeight: "600" }}>
                  Next
                </span>
                <CircleChevronRight size={18} strokeWidth={3} />
              </button>
            </div>
          </div>
        );

      case "deliveryDetails":
        return (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[--border]">
                <h3 className="text-lg font-semibold mb-3">Delivery Details</h3>
                <div className="space-y-2">
                  <>
                    <div className="flex justify-between gap-3">
                      <span className="text-sm opacity-70">Address:</span>
                      <span className="text-sm font-medium text-right">
                        {billingDetails.address}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-sm opacity-70">City:</span>
                      <span className="text-sm font-medium">
                        {billingDetails.city}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-sm opacity-70">State:</span>
                      <span className="text-sm font-medium">
                        {billingDetails.state}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-sm opacity-70">ZIP Code:</span>
                      <span className="text-sm font-medium">
                        {billingDetails.zipCode}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-sm opacity-70">Phone:</span>
                      <span className="text-sm font-medium">
                        {billingDetails.phoneNumber}
                      </span>
                    </div>
                  </>
                </div>
              </div>
              <div
                style={{
                  borderRadius: 5,
                  backgroundColor: colors.noteBg,
                  color: colors.noteText,
                }}
                className="p-4 mb-5"
              >
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex item-center">
                    {" "}
                    <Info className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Note</span>
                  </div>{" "}
                </div>
                <p className="text-sm">
                  {/* Once your payment is confirmed for this merch, the receipt
                  will be sent to your email and will contain the contact
                  information of the organizer
                  {(deliveryOption as string) == "delivery"
                    ? `, for you to discuss the
              delivery fee.`
                    : "."} */}
                  <p className="text-sm">
                    {(deliveryOption as string) === "delivery" ? (
                      <>
                        The organizer will reach out to you to discuss the best{" "}
                        <span className="">mode of delivery</span> and the{" "}
                        <span className="font-semibold">delivery fee</span>.
                      </>
                    ) : (
                      <>
                        The organizer will reach out to you with details on{" "}
                        <span className="font-semibold">how to pick up</span>{" "}
                        your merch.
                      </>
                    )}
                  </p>

                  <p className="mt-3">
                    <span className="">
                      {" "}
                      Ensure your contact details are correct.
                    </span>
                  </p>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCurrentStep("billing");
                  setStepCount(2);
                }}
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.buttonText,
                }}
                className="text-black py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3 border border-[--border]"
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
                onClick={() => {
                  setCurrentStep("summary");
                  setStepCount(4);
                }}
                className="w-full  py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-3 justify-center"
                style={{
                  color: colors.buttonText,
                  backgroundColor: colors.secondary,
                }}
              >
                <span style={{ fontSize: 18, padding: 5, fontWeight: "600" }}>
                  Continue
                </span>
                <CircleChevronRight size={18} strokeWidth={3} />
              </button>
            </div>
          </div>
        );

      case "pickupDetails":
        return (
          <div className="space-y-4">
            <div className="p-4 border border-[--border] rounded-lg bg-[var(--bg-secondary)]">
              <h3 className="text-lg font-semibold mb-2">Pickup Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm opacity-70">Event:</span>
                  <span className="font-semibold text-sm">
                    {selectedEvent?.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-70">Date:</span>
                  <span className="font-semibold text-sm">
                    {selectedEvent && formatDate(selectedEvent.date, false)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-70">Time:</span>
                  <span className="font-semibold text-sm">
                    {selectedEvent && formatTime(selectedEvent.time)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-70">Phone:</span>
                  <span className="font-semibold text-sm">{pickUpPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-70">Location:</span>
                  <a
                    href={selectedEvent?.placeURL}
                    target="_blank"
                    className="font-semibold text-[var(--secondary)] truncate hover:underline text-right text-sm flex items-center gap-1"
                  >
                    <span className="font-semibold text-right max-w-[200px] max-md:max-w-[120px] truncate">
                      {selectedEvent?.placeDescription}
                    </span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
            <div
              style={{
                borderRadius: 5,
                backgroundColor: colors.noteBg,
                color: colors.noteText,
              }}
              className="p-4 mb-5"
            >
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex item-center">
                  {" "}
                  <Info className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Note</span>
                </div>{" "}
              </div>
              <p className="text-sm">
                {/* Once your payment is confirmed for this merch, the receipt will
                be sent to your email and will contain the contact information
                of the organizer */}
                {/* {(deliveryOption as string) == "delivery"
                  ? `, The organizer will reach out to you regarding delivery and discuss best mode of delivery with you and the delivery fee.`
                  : "."} */}

                <p className="text-sm">
                  {(deliveryOption as string) === "delivery" ? (
                    <>
                      The organizer will reach out to you to discuss the best{" "}
                      <span className="">mode of delivery</span> and the{" "}
                      <span className="font-semibold">delivery fee</span>.
                    </>
                  ) : (
                    <>
                      The organizer will reach out to you with details on{" "}
                      <span className="font-semibold">how to pick up</span> your
                      merch.
                    </>
                  )}
                </p>

                <p className="mt-3">
                  Ensure your <span className="">contact details</span> are
                  correct.
                </p>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCurrentStep("billing");
                  setStepCount(2);
                }}
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.buttonText,
                }}
                className="text-black py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3 border border-[--border]"
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
                onClick={() => {
                  setCurrentStep("summary");
                  setStepCount(4);
                }}
                className="w-full  py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-3 justify-center"
                style={{
                  color: colors.buttonText,
                  backgroundColor: colors.secondary,
                }}
              >
                <span style={{ fontSize: 17, padding: 4, fontWeight: "600" }}>
                  Continue
                </span>
              </button>
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-4">
            {deliveryOption === "delivery" ? (
              <>
                <div className="max-h-[60vh] overflow-y-auto space-y-4 border-b border-b-[--border] pb-3">
                  <div className="relative">
                    <div
                      className={`grid grid-cols-1 gap-4 ${
                        isLoadingBilling && "opacity-30"
                      }`}
                    >
                      <div>
                        <label className="block text-sm font-medium opacity-50 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          placeholder="07012345678"
                          value={billingDetails.phoneNumber}
                          onChange={(e) =>
                            setBillingDetails({
                              ...billingDetails,
                              phoneNumber: e.target.value,
                            })
                          }
                          required
                          className="w-full p-2 bg-[var(--bg-secondary)] border border-[--border] rounded-md text-base"
                        />
                        <div
                          style={{
                            borderRadius: 5,
                            backgroundColor: colors.noteBg,
                            color: colors.noteText,
                          }}
                          className="p-4 mt-3"
                        >
                          <div className="flex items-center justify-between text-sm mb-2">
                            <div className="flex item-center">
                              {" "}
                              <Info className="h-5 w-5 mr-2" />
                              <span className="font-semibold">Note</span>
                            </div>{" "}
                          </div>
                          <p className="text-sm">
                            The organizer and delivery driver will use this
                            number to contact you about your order.
                          </p>
                          <p className="font-semibold mt-3 text-sm">
                            {" "}
                            Please ensure it is correct.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentStep("delivery");
                      setStepCount(1);
                    }}
                    style={{
                      backgroundColor: colors.bgSecondary,
                      color: colors.buttonText,
                    }}
                    className="text-black py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3 border border-[--border]"
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
                      (!selectedBillingAddress &&
                        (!billingDetails.address ||
                          !billingDetails.phoneNumber ||
                          !billingDetails.placeURL)) ||
                      isLoadingBilling
                    }
                    onClick={async () => {
                      const saved = await saveBillingAddress();
                      if (saved) {
                        setCurrentStep("deliveryDetails");
                      }

                      setStepCount(3);
                    }}
                    className="w-full  py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-3 justify-center disabled:opacity-50"
                    style={{
                      color: colors.buttonText,
                      backgroundColor: colors.secondary,
                    }}
                  >
                    <span
                      style={{ fontSize: 17, padding: 4, fontWeight: "600" }}
                    >
                      Continue
                    </span>
                    {(isLoading ||
                      loadingPaystack ||
                      loadingStripe ||
                      isLoadingBilling) && (
                      <Loader2 size={15} className="animate-spin" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium opacity-50 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="07012345678"
                    value={pickUpPhone}
                    onChange={(e) => setPickUpPhone(e.target.value)}
                    required
                    className="w-full p-2 bg-[var(--bg-secondary)] border border-[--border] rounded-md text-base"
                  />
                  <div
                    style={{
                      borderRadius: 5,
                      backgroundColor: colors.noteBg,
                      color: colors.noteText,
                    }}
                    className="p-4 mt-3"
                  >
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex item-center">
                        {" "}
                        <Info className="h-5 w-5 mr-2" />
                        <span className="font-semibold">Note</span>
                      </div>{" "}
                    </div>
                    <p className="text-sm">
                      The organizer will use this number to contact you about
                      your order.
                    </p>
                    <p className="font-semibold mt-3 text-sm">
                      {" "}
                      Please ensure it is correct.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setCurrentStep("delivery");
                      setStepCount(2);
                    }}
                    style={{
                      backgroundColor: colors.bgSecondary,
                      color: colors.buttonText,
                    }}
                    className="text-black py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3 border border-[--border]"
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
                    onClick={() => {
                      if (!pickUpPhone) {
                        toast.error("Please enter a phone number");
                        return;
                      }
                      setCurrentStep("pickupDetails");
                      setStepCount(3);
                    }}
                    className="w-full  py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-3 justify-center"
                    style={{
                      color: colors.buttonText,
                      backgroundColor: colors.secondary,
                    }}
                  >
                    <span
                      style={{ fontSize: 17, padding: 4, fontWeight: "600" }}
                    >
                      Continue
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case "summary":
        const subtotal = Number(merchItem.price) * quantity;
        const fee = subtotal * 0.05 + getFee(merchItem.country);
        const total = subtotal + fee;

        return (
          <div className="space-y-4">
            <div className="max-h-[50vh] overflow-y-auto space-y-4 border-b border-b-[--border] pb-3">
              <p className="text-base font-medium">Purchase Summary</p>

              <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-[--border] divide-dashed dash pb-4">
                <span className="flex items-center gap-1 text-sm">
                  <span>{quantity}</span> <X size={13} />{" "}
                  <span className="opacity-60">
                    {merchItem.name}
                    {selectedVariants.length > 0 &&
                      ` (${selectedVariants
                        .map((v) => `${v.type}: ${v.value}`)
                        .join(", ")})`}
                  </span>
                </span>
                <span className="font-semibold">
                  {countries[merchItem.country].currency}
                  {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span>Fees</span>
                  <span className="opacity-60 text-xs">
                    Non Refundable 5% + {getFeeString(merchItem.country)} Fee
                  </span>
                </div>
                <span className="font-semibold">
                  {countries[merchItem.country].currency}
                  {fee.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span>Total</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[--secondary] font-semibold">
                    {countries[merchItem.country].currency}
                    {total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="!mt-7">
                <p className="text-sm font-medium opacity-50 mb-1">
                  Note <span className="text-xs">(optional)</span>
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add your note here"
                  className="w-full p-2 bg-[var(--bg-secondary)] border border-[--border] rounded-md text-base resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (deliveryOption === "delivery") {
                    setCurrentStep("deliveryDetails");
                  } else {
                    setCurrentStep("pickupDetails");
                  }
                  setStepCount(3);
                }}
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.buttonText,
                }}
                className=" py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center justify-center gap-3 border border-[--border]"
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
                disabled={isLoading || loadingPaystack || loadingStripe}
                onClick={() => {
                  countries[merchItem.country].payment === "paystack"
                    ? initializePaystack()
                    : initializeStripe();
                }}
                className="w-full  py-2 px-4 rounded-md hover:md:opacity-50 text-sm flex items-center gap-3 justify-center disabled:opacity-50"
                style={{
                  color: colors.buttonText,
                  backgroundColor: colors.secondary,
                }}
              >
                <span style={{ fontSize: 18, padding: 4, fontWeight: "600" }}>
                  Pay {countries[merchItem.country].currency}
                  {total.toLocaleString()} Now
                </span>
                {(isLoading || loadingPaystack || loadingStripe) && (
                  <Loader2 size={15} className="animate-spin" />
                )}
              </button>
            </div>
          </div>
        );
    }
  };

  useEffect(() => {
    let interval: any;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  useEffect(() => {
    if (autocompleteRef.current && inputRef.current) {
      autocompleteRef.current.setOptions({
        componentRestrictions: { country: ["us", "ca", "gh", "ng"] },
      });

      autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
    }
  }, [inputRef.current]);

  // useEffect(() => {
  //   if (currentStep === "delivery" && userID && deliveryOption == "delivery") {
  //     fetchBillingAddresses();
  //   }
  // }, [currentStep, userID, deliveryOption]);

  return (
    <div className="font-[poppins]">
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
                color: colors.primary,
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
                style={{ color: colors.primary }}
                className="text-xl font-bold mb-4"
              >
                Buy Merch
              </h2>{" "}
              <button
                onClick={handleClose}
                className="text-sm text-gray-600 hover:text-gray-800 border border-[--border]"
                style={{
                  backgroundColor: colors.bgSecondary,
                  marginBottom: 20,
                  padding: 5,
                  borderRadius: 100,
                }}
              >
                <X
                  size={18}
                  strokeWidth={3}
                  style={{ color: colors.primary, fontWeight: "bold" }}
                />
              </button>
            </div>
            <>
              <div className="flex justify-between mb-6 gap-4">
                {[0, 1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-2 rounded-full ${
                      stepCount === step
                        ? "bg-[var(--secondary)]"
                        : "bg-[var(--primary)] opacity-10"
                    }`}
                  />
                ))}
              </div>
              {renderStep()}
            </>
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
            Are you sure you want to continue with this email,
            <span className="font-bold"> {email} </span>, your purchase details
            will be sent to it once you complete the purchase.
          </>
        }
      />
      <ConfirmComponent />
      <InvalidEmail
        modalColors={modalColors}
        isOpen={showInvalidEmail}
        onClose={() => setShowInvalidEmail(false)}
      />

      <OtpModal
        isLoading={isLoading}
        modalColors={modalColors}
        isOpen={isOtpFreeOpen}
        onClose={() => setIsOtpFreeOpen(false)}
        onVerify={handleVerifyOtp}
        otpTimer={otpTimer}
        handleSendOtp={handleSendOtp}
      />
      {showEmailUpdateModal && (
        <EmailUpdateModal
          modalColors={modalColors}
          isOpen={showEmailUpdateModal}
          onClose={() => setShowEmailUpdateModal(false)}
          onUpdateEmail={handleUpdateEmail}
        />
      )}
    </div>
  );
}
