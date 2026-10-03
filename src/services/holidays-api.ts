import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();

const getToken = () => {
    const admin = localStorage.getItem("admin")
        ? JSON.parse(localStorage.getItem("admin") as string)
        : null;

    return admin ? admin.token : null;
};

export const getHolidays = async (year: number) => {
    const response = await axios.get(`${API_URL}identity/holidays?year=${year}`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    });
    return response.data;
};
