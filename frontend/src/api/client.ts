import axios from "axios";

import {
  getAdminAccessToken,
} from "../auth/AdminAuthContext";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:4000/api";

export const apiClient =
  axios.create({
    baseURL: apiBaseUrl,
    headers: {
      "Content-Type":
        "application/json",
    },
    timeout: 10000,
  });

apiClient.interceptors.request.use(
  (config) => {
    const token =
      getAdminAccessToken();

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) =>
    Promise.reject(error),
);