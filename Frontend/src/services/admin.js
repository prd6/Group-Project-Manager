import axios from "axios";
import { API_ORIGIN } from "./apiConfig";

const AdminAPI = axios.create({
  baseURL: `${API_ORIGIN}/api/admin`,
});

export default AdminAPI;
