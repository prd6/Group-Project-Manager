import API from "./api";

const CommunityAPI = {
    get: (url, config) => API.get(`/community${url}`, config),

    post: (url, data, config) =>
        API.post(`/community${url}`, data, config),

    put: (url, data, config) =>
        API.put(`/community${url}`, data, config),

    patch: (url, data, config) =>
        API.patch(`/community${url}`, data, config),

    delete: (url, config) =>
        API.delete(`/community${url}`, config),
};

export default CommunityAPI;