import axios from "axios";
import { API_ORIGIN } from "./apiConfig";

const ContactAPI = axios.create({
    baseURL: `${API_ORIGIN}/api/contact`,
});

export default ContactAPI;