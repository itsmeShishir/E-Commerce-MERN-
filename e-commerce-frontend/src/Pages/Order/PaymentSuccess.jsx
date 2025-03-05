import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pidx = searchParams.get("pidx");

  const [paymentMessage, setPaymentMessage] = useState("Verifying your payment...");

  useEffect(() => {
    if (!pidx) return;

    const verifyPayment = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/payment/verify?pidx=${pidx}`
        );
        // Expecting JSON response with { success: true } on success.
        if (response.data?.success) {
          setPaymentMessage("Payment verified! Redirecting...");
          setTimeout(() => {
            navigate("/?status=success");
          }, 3000);
        } else {
          navigate("/?status=failed");
        }
      } catch (error) {
        console.error("Payment verification failed:", error);
        navigate("/?status=failed");
      }
    };

    verifyPayment();
  }, [pidx, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-xl font-semibold text-white">{paymentMessage}</h1>
    </div>
  );
};

export default PaymentSuccess;
