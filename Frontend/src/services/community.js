import axios from "axios";

const CommunityAPI = axios.create({
  baseURL: "http://localhost:5000/api/community",
});

export default CommunityAPI;
