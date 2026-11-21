import axiosClient from "./axiosClient";

export const getHistory = async () => {
  const { data } = await axiosClient.get("/history");
  return data;
};

export const getInterviewDetails = async (sessionId) => {
  const { data } = await axiosClient.get(`/history/${sessionId}`);
  return data;
};
