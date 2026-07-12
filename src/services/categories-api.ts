import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const CATEGORIES_API_URL = `${API_URL}gaming-m/gaming-categories/`;

const getToken = () => {
  const admin = localStorage.getItem("admin")
    ? JSON.parse(localStorage.getItem("admin") as string)
    : null;

  return admin ? admin.token : null;
};

export const getCategories = async () => {
  try {
    const response = await axios.get(`${CATEGORIES_API_URL}`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};