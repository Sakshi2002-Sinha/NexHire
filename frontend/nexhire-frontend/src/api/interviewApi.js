import axiosClient from "./axiosClient";

export const startInterviewApi = async (payload) => {
  const { data } = await axiosClient.post("/interview/start", payload);
  return data;
};

export const submitAnswerApi = async (payload) => {
  const { data } = await axiosClient.post("/interview/answer", payload);
  return data;
};

export const endInterviewApi = async (payload) => {
  const { data } = await axiosClient.post("/interview/end", payload);
  return data;
};

export const getActiveInterviewApi = async () => {
  const { data } = await axiosClient.get("/interview/active");
  return data;
};

export const uploadResumeApi = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await axiosClient.post("/interview/upload", formData);
  return data;
};
