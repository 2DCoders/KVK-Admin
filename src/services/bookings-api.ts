import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const BOOKINGS_API_URL = `${API_URL}gaming-m/gaming-bookings/`;

const getToken = () => {
  const admin = localStorage.getItem("admin")
    ? JSON.parse(localStorage.getItem("admin") as string)
    : null;

  return admin ? admin.token : null;
};

export const multiHoldBooking = async (bookingData: any) => {
    try {
        const response = await axios.post(`${BOOKINGS_API_URL}multi-hold`, bookingData, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}