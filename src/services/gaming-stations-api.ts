import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const GAMING_API_URL = `${API_URL}gaming-m/gaming-stations/`;

const getToken = () => {
  const admin = localStorage.getItem("admin")
    ? JSON.parse(localStorage.getItem("admin") as string)
    : null;

  return admin ? admin.token : null;
};

export const createGamingStation = async (stationData: any) => {
    try {
        const response = await axios.post(`${GAMING_API_URL}`, stationData, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getGamingStationsByCategory = async (categoryId: string) => {
    try {
        const response = await axios.get(`${GAMING_API_URL}by-category/${categoryId}`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateGamingStation = async (stationData: any) => {
    try {
        const response = await axios.put(`${GAMING_API_URL}`, stationData, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};