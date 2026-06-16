import axiosClient from "./axiosClient";

export const startInterviewApi = async (data) => {
  const response = await axiosClient.post(
    "/interview/start",
    data
  );
  return response.data;
};

export const submitAnswerApi = async (data) => {
  const response = await axiosClient.post(
    "/interview/answer",
    data
  );
  return response.data;
};

export const endInterviewApi = async (data) => {
  const response = await axiosClient.post(
    "/interview/end",
    data
  );
  return response.data;
};

export const uploadResumeApi = async (formData) => {
  const response = await axiosClient.post(
    "/interview/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};