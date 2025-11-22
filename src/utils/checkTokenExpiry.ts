export const checkTokenExpiry = () => {
    const loginTime = localStorage.getItem("loginTimeReadable");
    const token = localStorage.getItem("token");

    if (!loginTime || !token) return; // nothing to check

    const loginDate = new Date(loginTime).getTime();
    const now = Date.now();


    const HOURS_23 = 23 * 60 * 60 * 1000;

    if (now - loginDate >= HOURS_23) {
        localStorage.removeItem("token");
        localStorage.removeItem("loginTimeReadable");
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userId");
    }
};