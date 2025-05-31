import axios from "axios";
import { API_URL } from "../config";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Funciones que usan la instancia configurada
export const registerRequest = async (user) =>
  instance.post(`/auth/register`, user);

export const loginRequest = async (user) => 
  instance.post(`/auth/login`, user);

export const verifyTokenRequest = async () => 
  instance.get(`/auth/verify`);

export default instance;