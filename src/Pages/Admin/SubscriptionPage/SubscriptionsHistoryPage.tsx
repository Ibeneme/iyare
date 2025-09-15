import { useEffect, useState } from "react";
import SubscriptionsHistory from "./SubscriptionsHistory";

const SubscriptionsHistoryPage = () => {
  const [payerId, setPayerId] = useState<string>("");

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user && user._id) {
          setPayerId(user._id);
        }
      } catch (err) {
        console.error("Error parsing user from localStorage:", err);
      }
    }
  }, []);

  return (
    <div>
      {payerId && <SubscriptionsHistory payerId={payerId} />}
    </div>
  );
};

export default SubscriptionsHistoryPage;