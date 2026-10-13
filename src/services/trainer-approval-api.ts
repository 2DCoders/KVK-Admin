import axios from "axios";
import { getEnv } from "@/env";

export type TrainerApprovalRequest = {
  id: string; trainerId: string | null; firstName: string; lastName: string;
  userName: string; email: string; phoneNumber: string; specialization: string | null;
  yearsOfExperience: number; rating: number; role: string | null; isFreelance: boolean;
  profilePicture: string | null; createdAt: string; lastModifiedAt: string;
  approvalStatus: number | string;
};
const baseUrl = `${getEnv().API_URL}gym/trainers`;
const auth = () => ({ headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem("admin") || "null")?.token ?? ""}` } });

export async function getTrainerApprovalRequests(): Promise<TrainerApprovalRequest[]> {
  const { data } = await axios.get(baseUrl, auth());
  if (data.succeeded === false) throw new Error(data.message || "Failed to load approval requests.");
  const rows = data.additionalData?.response ?? data.response ?? data;
  if (!Array.isArray(rows)) throw new Error("Invalid approval requests response.");
  return rows.filter((row: TrainerApprovalRequest) => Number(row.approvalStatus) === 1 || String(row.approvalStatus).toLowerCase() === "pending");
}

export async function decideTrainerRequest(trainerId: string, decision: "approve" | "reject") {
  const { data } = await axios.post(`${baseUrl}/${trainerId}/approve`, null, { ...auth(), params: { approvalStatus: decision === "approve" ? 2 : 3 } });
  if (data.succeeded === false) throw new Error(data.message || "Failed to update request.");
  return { smsSent: data.additionalData?.smsSent as boolean | undefined };
}
