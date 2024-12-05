export const apiUrl =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:5000/api"
    : "https://iuh-website-dkkl.onrender.com/api"; // URL khi deploy

export const LOCAL_STORAGE_TOKEN_NAME = "token";
