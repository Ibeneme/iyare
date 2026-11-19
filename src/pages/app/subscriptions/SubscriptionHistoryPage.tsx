import { getCookie } from "../../../utils/cookies";
import { useEffect, useState } from "react";
import SubscriptionsHistory from "./SubscriptionHistoryTable";

const SubscriptionsHistoryPage = () => {
  const [payerId, setPayerId] = useState<string>("");

  useEffect(() => {
    const userString = getCookie("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user && user._id) {
          setPayerId(user._id);
        }
      } catch (err) {
        console.error("Error parsing user from cookies:", err);
      }
    }
  }, []);

  return <>{payerId && <SubscriptionsHistory />}</>;
};

export default SubscriptionsHistoryPage;
