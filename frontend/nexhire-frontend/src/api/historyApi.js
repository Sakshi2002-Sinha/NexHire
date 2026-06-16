import axiosClient from "./axiosClient";

export const getHistory = async () => {
  const response = await axiosClient.get(
    "/history"
  );
  

  return response.data;
};

export const getInterviewDetails = async (
  sessionId
) => {
  const response =
    await axiosClient.get(
      `/interview/${sessionId}`
    );

  return response.data;
};