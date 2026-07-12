import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const DAYEND_API_URL = `${API_URL}gaming/dayend/`;

const getToken = () => {
  const admin = localStorage.getItem("admin")
    ? JSON.parse(localStorage.getItem("admin") as string)
    : null;

  return admin ? admin.token : null;
};

export const getDayEndData = async (date?: string) => {
  try {
    const response = await axios.get(DAYEND_API_URL, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      params: date ? { date } : {},
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const performDayEnd = async (dayEndData: any) => {
  try {
    const response = await axios.post(DAYEND_API_URL, dayEndData, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};