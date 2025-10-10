import axiosClient from "./axiosClient";

const authApi = {
  login: (email: string, password: string) =>  axiosClient.post("/login.php", { email, password }),
  getUserInfo: () =>  axiosClient.get("/profile.php"),
  autoLogin: () => axiosClient.post("/autoLogin.php"),
};

export default authApi;