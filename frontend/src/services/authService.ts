import API from "./api";

export const login = (data: any) => API.post("/auth/login", data);

export const register = (data: any) => API.post("/auth/register", data);