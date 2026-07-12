import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const MEMBERSHIP_PLANS_API_URL = `${API_URL}gym/membership-plans/`;

const getToken = () => {
  const admin = localStorage.getItem("admin")
    ? JSON.parse(localStorage.getItem("admin") as string)
    : null;

  return admin ? admin.token : null;
};

export const getMembershipPlans = async () => {
  try {
    const response = await axios.get(`${MEMBERSHIP_PLANS_API_URL}`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};