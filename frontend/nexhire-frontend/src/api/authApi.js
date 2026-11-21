import axiosClient from "./axiosClient";

export const loginApi = async ({ email, password }) => {
  // OAuth2 password flow: form-encoded, and the email travels as "username".
  const form = new URLSearchParams({ username: email, password });
  const { data } = await axiosClient.post("/auth/login", form);
  return data;
};

export const registerApi = async (payload) => {
  const { data } = await axiosClient.post("/auth/register", payload);
  return data;
};

export const getMeApi = async () => {
  const { data } = await axiosClient.get("/auth/me");
  return data;
};
