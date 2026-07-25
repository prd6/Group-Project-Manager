import API from "./api";

const ContactAPI = {
    get: (url, config) => API.get(`/contact${url}`, config),

    post: (url, data, config) =>
        API.post(`/contact${url}`, data, config),

    put: (url, data, config) =>
        API.put(`/contact${url}`, data, config),

    patch: (url, data, config) =>
        API.patch(`/contact${url}`, data, config),

    delete: (url, config) =>
        API.delete(`/contact${url}`, config),
};

export default ContactAPI;