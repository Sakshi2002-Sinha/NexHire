import axiosClient from "./axiosClient";

export const getDashboardStats = async () => {
  const { data } = await axiosClient.get("/dashboard/stats");
  return data;
};
