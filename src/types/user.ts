export interface UserDetails {
  photoURL?: string;
  name?: string;
  email?: string;
  canReceiveEmail?: boolean;
  customerId?: string;
  [key: string]: any;
}
