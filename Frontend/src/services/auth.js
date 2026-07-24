import axios from "axios";
import { API_ORIGIN } from "./apiConfig";

const API = axios.create({
    baseURL: `${API_ORIGIN}/api/auth`,
});

export default API;
