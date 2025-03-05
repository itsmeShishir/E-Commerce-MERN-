import { Link, useNavigate } from "react-router-dom";
import ProgressSteps from "../../Components/ProgressSteps";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const cart = useSelector((state) => state.cart);
  const shipping = useSelector((state) => state.shipping.shippingDetails);

  const itemsTotal = cart.cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shippingCost = itemsTotal > 500 ? 0 : 10; // free shipping over $500 example
  const tax = itemsTotal * 0.1; // 10% tax
  const total = itemsTotal + shippingCost + tax;

  const handlePlaceOrder = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo")); // your user info storage
      const token = userInfo ? userInfo.token : null;
      if (!token) {
        toast.error("You must be logged in to place an order.");
        return;
      }

      const payload = {
        items: cart.cartItems.map((item) => ({
          product: item._id,       // ensure this is the product ID
          quantity: item.quantity,
        })),
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        email: shipping.email,
        shippingAddress: shipping.address,
        city: shipping.city,
        phone: shipping.phone,
        zipcode: shipping.zipcode,
        taxAmount: tax,
        shippingCost,
        amount: total * 100, // converting to smallest currency unit (e.g., paisa)
      };

      const response = await axios.post(
        "http://localhost:5000/api/payment/initialize",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const { payment_url } = response.data;
        if (!payment_url) {
          toast.success("Order placed successfully (Cash on Delivery).");
          navigate("/order");
        } else {
          window.location.href = payment_url;
        }
      }
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error("Payment Error: " + error.message);
    }
  };

  return (
    <>
      <ProgressSteps step1 step2 step3 />
      <div className="w-full mx-auto mt-10 pl-20 text-white">
        {cart.cartItems.length === 0 ? (
          <h1>Cart is empty</h1>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <td className="px-1 py-2 text-left">Image</td>
                  <td className="px-1 py-2 text-left">Product</td>
                  <td className="px-1 py-2 text-left">Quantity</td>
                  <td className="px-1 py-2 text-left">Price</td>
                  <td className="px-1 py-2 text-left">Total</td>
                </tr>
              </thead>
              <tbody>
                {cart.cartItems.map((item, index) => (
                  <tr key={index}>
                    <td className="p-2">
                      <img
                        src={`http://localhost:5000/${item.productImage}`}
                        alt={item.name}
                        className="w-16 h-16 object-cover"
                      />
                    </td>
                    <td className="p-2">
                      <Link to={`/product/${item._id}`}>{item.name}</Link>
                    </td>
                    <td className="p-2">{item.quantity}</td>
                    <td className="p-2">{item.price.toFixed(2)}</td>
                    <td className="p-2">
                      ${(item.quantity * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 w-[90%]">
          <h2 className="text-2xl font-semibold mb-5">Order Summary</h2>
          <div className="flex justify-between flex-wrap p-8 bg-[#181818]">
            <ul className="text-lg">
              <li>
                <span className="font-semibold">Items:</span> {cart.cartItems.length}
              </li>
              <li>
                <span className="font-semibold">Shipping:</span> ${shippingCost}
              </li>
              <li>
                <span className="font-semibold">Tax:</span> ${tax.toFixed(2)}
              </li>
              <li>
                <span className="font-semibold">Total:</span> ${total.toFixed(2)}
              </li>
            </ul>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Shipping</h2>
              <p>
                <strong>
                  Address: {shipping.address}, {shipping.city}
                </strong>
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Payment Method</h2>
              <strong>Method:</strong>{" "}
              <span className="text-purple-500 font-bold">
                {shipping.paymentMethod || "N/A"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="bg-pink-500 text-white py-2 px-4 rounded-full text-lg w-full mt-4"
            onClick={handlePlaceOrder}
          >
            Place Order
          </button>
        </div>
      </div>
    </>
  );
};

export default PlaceOrder;
