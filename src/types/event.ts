/**
 * Contact information type
 */
export type ContactType =
  | "email"
  | "phone"
  | "instagram"
  | "twitter"
  | "facebook"
  | "whatsapp"
  | "tiktok";

/**
 * Contact information for an event
 */
export interface ContactInfo {
  type: ContactType;
  value: string;
}

/**
 * Event ticket information
 */
export interface EventTicket {
  addPercent?: boolean;
  /** Name of the ticket tier */
  name: string;
  /** Optional ticket-specific instruction shown to buyers */
  instruction?: string;
  /** Price of the ticket */
  price: string;
  /** Maximum tickets per purchase */
  limit?: string;
  /** Minimum tickets per purchase */
  limitMin?: string;
  /** Number of tickets available in this tier (optional) - 0 means sold out, "unlimited" means unlimited capacity */
  quantity?: string | "unlimited" | "sold out";
  extraPercent?: number;
}

/**
 * Role information for events
 */
export type EventRole = "Payment Manager" | "Admin" | "Security" | "Host";

/**
 * Event theme type
 */
export type EventTheme = "Indoor" | "Outdoor" | "Virtual" | "Hybrid";

/**
 * Comprehensive event data structure
 */
export interface EventDetails {
  /** Document ID of the event */
  id: string;
  /** User ID of the event creator */
  userID: string;
  /** Event title */
  title: string;
  /** Event description */
  description: string;
  /** Event type: public or private */
  eventType: "public" | "private";
  /** URL to event image */
  imageUrl: string;
  /** Short URL for the event */
  shortURL: string;
  /** Whether the event charges a percentage fee */
  addPercent?: boolean;
  /** Whether balance has been calculated */
  balanceCalculated?: boolean;
  /** Whether the event allows referrals */
  referrals?: boolean;
  /** Whether the event is free */
  isFree: boolean;
  /** Whether the event has unlimited spots */
  isUnlimited: boolean;
  /** Whether the event allows PayPal payments */
  isPayPalEnabled: boolean;
  /** Whether the event has been reviewed */
  isReviewed: boolean;
  /** Whether the event has been cancelled */
  isCancelled: boolean;
  /** Whether the event uses WhatsApp communications */
  isWA?: boolean;
  /** Total number of spots available */
  spot: number;
  /** Number of spots already taken */
  spotTaken: number;
  /** Event start timestamp */
  time: number;
  /** Event date */
  date: number;
  /** Event end time */
  endTime: number;
  /** Event end date */
  endDate: number;
  /** Event creation timestamp */
  timestamp: number | string | Date;
  /** Event theme */
  theme: EventTheme;
  /** Country where the event takes place */
  country: string;
  /** State/province where the event takes place */
  state: string;
  /** City where the event takes place */
  city: string;
  /** Description of the event location */
  placeDescription: string;
  /** URL to the event location on maps */
  placeURL: string;
  /** Latitude of event location */
  lat: number;
  /** Longitude of event location */
  lng: number;
  /** Ticket information */
  tickets: EventTicket[];
  /** Link to external ticket source */
  ticketLink?: string;
  /** Array of UIDs that have taken spots */
  takenBy: string[];
  /** Contact information for the event */
  contactInfo?: ContactInfo[];
  /** Role for the current user (when viewing my events) */
  role?: EventRole;
  /** Array of notification timestamps that have been sent */
  notificationsSent?: string[];
  /** Array of email notifications that have been sent */
  emailsSent?: string[];
  /** When the event was added to top events (for featured events) */
  addedToTopAt?: Date;

  refundPolicy?: string;

  ticketAmount?: number;

  checkEmail: boolean;

  hasDiscount?: boolean;

  salesRepCode?: string;

  requireApproval?: boolean;

  hideLocation?: boolean;

  collectPhoneNumber?: boolean;
}

export interface Discount {
  code: string;
  createdAt: number;
  discountPercentage: number;
}

/**
 * Role information for events
 */
export interface EventRoles {
  id?: string;
  userId: string;
  role: EventRole;
  assignedAt: number;
}

/**
 * Props for the EventsProvider component
 */
export interface EventsProviderProps {
  children: React.ReactNode;
}
