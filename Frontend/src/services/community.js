import axios from "axios";
import { API_ORIGIN } from "./apiConfig";

const CommunityAPI = axios.create({
  baseURL: `${API_ORIGIN}/api/community`,
});

export default CommunityAPI;
