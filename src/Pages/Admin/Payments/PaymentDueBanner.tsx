import React, { useEffect, useState } from "react";
import "./PaymentDueBanner.css";

const PaymentDueBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const paymentDue = localStorage.getItem("paymentDue");
    setShowBanner(paymentDue === "true");
  }, []);

  if (!showBanner) return null;

  return (
    <div className="paymentdue-banner">
      <div className="marquee-wrapper">
        <div className="marquee">
          <h3 className="paymentdue-message">
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children. &nbsp;&nbsp;&nbsp;
            Payment is due for one or more of your children.
          </h3>
        </div>
      </div>
    </div>
  );
};

export default PaymentDueBanner;