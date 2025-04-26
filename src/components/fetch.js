import { message } from "antd";

const BASE_URL = "https://bigbrain-backend-nine.vercel.app";

const defaultSelect = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};
//Get
const get = (url) => {
  return fetch(`${BASE_URL}${url}`, {
    ...defaultSelect,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${window.localStorage.getItem("token")}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    })
    .catch((error) => {
      message.error(error.message);
      throw error;
    });
};
//POST
const post = (url, data) => {
  return fetch(`${BASE_URL}${url}`, {
    ...defaultSelect,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${window.localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    })
    .catch((error) => {
      message.error(error.message);
      throw error;
    });
};
//PUT
const put = (url, data) => {
  return fetch(`${BASE_URL}${url}`, {
    ...defaultSelect,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${window.localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    })
    .catch((error) => {
      message.error(error.message);
      throw error;
    });
};
const api = {
  get,
  post,
  put,
};
export default api;
