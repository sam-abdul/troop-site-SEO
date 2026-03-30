import api from "./api";

export interface Event {
  id: string;
  [key: string]: any;
}

export interface EventsResponse {
  success: boolean;
  data: Event[];
  message?: string;
}

export const eventsAPI = {
  getUserEvents: async (userId: string): Promise<EventsResponse> => {
    const response = await api.get(
      `/events/user/${encodeURIComponent(userId)}`
    );
    return response.data;
  },
  getSingleEvent: async (eventId: string): Promise<any> => {
    const response = await api.get(`/events/${encodeURIComponent(eventId)}`);
    return response.data;
  },
  getEventByShortURL: async (shortURL: string): Promise<any> => {
    const response = await api.get(
      `/events/by-short-url?shortURL=${encodeURIComponent(shortURL)}`
    );
    return response.data;
  },
};
