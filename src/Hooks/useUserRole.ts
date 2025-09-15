import { useEffect, useState } from "react";

interface User {
  role?: string;
  superadmin?: boolean;
  [key: string]: any;
}

const useUserRole = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserFromLocalStorage = () => {
      try {
        const userData = localStorage.getItem("user");
        if (!userData) return;

        const parsedUser: User = JSON.parse(userData);

        setUser(parsedUser);
        setUserRole(parsedUser?.userType || parsedUser?.role || null);
        setIsSuperadmin(parsedUser?.superadmin || false);
      } catch (error) {
        console.error("❌ Failed to parse user from localStorage:", error);
        setUser(null);
        setUserRole(null);
        setIsSuperadmin(false);
      }
    };

    fetchUserFromLocalStorage();
  }, []);

  return { userRole, isSuperadmin, user };
};

export default useUserRole;