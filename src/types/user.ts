export interface UserDetails {
  photoURL?: string;
  name?: string;
  email?: string;
  canReceiveEmail?: boolean;
  customerId?: string;
  ticketPhoneNumber?: string;
  [key: string]: any;
}
