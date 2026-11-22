import axiosClient from "./axiosClient";

export const listResumesApi = async () => {
  const { data } = await axiosClient.get("/resumes");
  return data.resumes;
};

export const getResumeTreeApi = async (resumeId) => {
  const { data } = await axiosClient.get(`/resumes/${resumeId}/tree`);
  return data;
};

export const analyzeResumeApi = async (resumeId) => {
  const { data } = await axiosClient.post(`/resumes/${resumeId}/analyze`);
  return data;
};
