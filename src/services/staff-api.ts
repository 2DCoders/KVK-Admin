import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const STAFF_API_URL = `${API_URL}identity-m/auth/staff`;

const getToken = () => {
    const admin = localStorage.getItem("admin")
        ? JSON.parse(localStorage.getItem("admin") as string)
        : null;

    return admin ? admin.token : null;
};

export const getStaffMembers = async () => {
    const token = getToken();
    try {
        const response = await axios.get(STAFF_API_URL + '/list', {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}