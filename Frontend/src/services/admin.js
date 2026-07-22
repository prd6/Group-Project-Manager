import axios from "axios";

const AdminAPI = axios.create({
  baseURL: "http://localhost:5000/api/admin",
});

export default AdminAPI;