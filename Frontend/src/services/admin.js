import API from "./auth";

const AdminAPI = {
    get: (url, config) => API.get(`/admin${url}`, config),

    post: (url, data, config) =>
        API.post(`/admin${url}`, data, config),

    put: (url, data, config) =>
        API.put(`/admin${url}`, data, config),

    patch: (url, data, config) =>
        API.patch(`/admin${url}`, data, config),

    delete: (url, config) =>
        API.delete(`/admin${url}`, config),
};

export default AdminAPI;