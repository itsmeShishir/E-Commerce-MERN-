import { useState } from "react";
import { useDispatch } from "react-redux";
import { saveShippingDetails } from "../../redux/features/cart/shippingSlice"; 
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ProgressSteps from "../../Components/ProgressSteps";

const Shipping = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [country, setCountry] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleOrder = (e) => {
    e.preventDefault();

    if (
      !firstName ||
      !lastName ||
      !email ||
      !address ||
      !city ||
      !zipcode ||
      !phone ||
      !country
    ) {
      toast.error("All fields are required");
      return;
    }

    const shippingData = {
      firstName,
      lastName,
      email,
      address,
      city,
      country,
      phone,
      zipcode,
      paymentMethod,
    };

    // Save shipping details in Redux
    dispatch(saveShippingDetails(shippingData));

    // Move to PlaceOrder page
    navigate("/placeorder");
  };

  return (
    <div className="container mx-auto mt-10">
      <ProgressSteps step1 step2 />
      <div className="mt-[10rem] flex justify-around items-center flex-wrap">
        <form className="w-[40rem]" onSubmit={handleOrder}>
          <h1 className="text-2xl font-semibold mb-4 text-pink-500">
            Shipping
          </h1>

          <div className="mb-4">
            <label className="block text-white mb-2">First Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter First Name"
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white mb-2">Last Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter Last Name"
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white mb-2">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded"
              placeholder="Enter Email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white mb-2">Address</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter address"
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white mb-2">City</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter city"
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white mb-2">Postal/Zip Code</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter postal code"
              onChange={(e) => setZipcode(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white mb-2">Phone</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              placeholder="Enter Phone Number"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white mb-2">Country</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter country"
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          {/* Payment Method Selection */}
          <div className="mb-4">
            <label className="block text-gray-400">Select Payment Method</label>
            <div className="mt-2">
              <label className="inline-flex items-center mr-4">
                <input
                  type="radio"
                  className="form-radio text-pink-500"
                  name="paymentMethod"
                  value="Khalti"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="ml-2 text-white">Khalti</span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-pink-500"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="ml-2 text-white">Cash on Delivery</span>
              </label>
            </div>
          </div>

          <button
            className="bg-pink-500 text-white py-2 px-4 rounded-full text-lg w-full"
            type="submit"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default Shipping;
