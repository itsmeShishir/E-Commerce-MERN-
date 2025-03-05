import axios from "axios";
import request from "request";
import jwt from "jsonwebtoken";

import Order from "../models/OrderModel.js";
import OrderItem from "../models/orderItemModel.js";
import Product from "../models/productModel.js";
import UserToken from "../models/usertokenModel.js";

export const initializePayment = async (req, res) => {
  try {
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader) {
      return res.status(401).json({ message: "No authorization header found" });
    }
    const token = tokenHeader.split(" ")[1];
    const isTokenExists = await UserToken.findOne({ jwt: token });
    if (!isTokenExists) {
      return res.status(401).json({ message: "Access Denied. Please login." });
    }
    const decoded = jwt.verify(token, process.env.JWT);

    const {
      items,
      firstName,
      lastName,
      email,
      shippingAddress,
      city,
      phone,
      zipcode,
      taxAmount,
      shippingCost,
    } = req.body;

    // Calculate total amount in the base currency
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      totalAmount += product.price * item.quantity;

      // Create an order item document (extra fields removed to match schema)
      const orderItem = new OrderItem({
        product: item.product,
        quantity: item.quantity,
        user: decoded.id,
      });
      await orderItem.save();
    }

    // Add tax & shipping cost (if provided)
    totalAmount += (taxAmount || 0) + (shippingCost || 0);

    // Convert to paisa (smallest currency unit)
    const totalAmountInPaisa = totalAmount * 100;

    // Create a new Order in DB
    const newOrder = new Order({
      user: decoded.id,
      paymentStatus: "Pending", // Updated from "pending" to "Pending"
      payment_token: "", // will update after Khalti response
      amount: totalAmountInPaisa,
    });
    await newOrder.save();

    // Build payload for Khalti ePayment initiation with purchase_order_id included
    const payload = {
      return_url: "http://localhost:5173/payment-success",
      website_url: "http://localhost:5000",
      amount: totalAmountInPaisa,
      purchase_order_id: `ORDER_${newOrder._id}`, // Required field added here
      purchase_order_name: `Order-${newOrder._id}`,
      customer_info: {
        name: `${firstName} ${lastName}`,
        email,
        phone,
      },
    };

    // Options for request to Khalti
    const options = {
      method: "POST",
      url: "https://a.khalti.com/api/v2/epayment/initiate/",
      headers: {
        Authorization: `Key ${process.env.KHALTI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };

    // Make request to Khalti
    request(options, async (error, response) => {
      if (error) {
        console.error("Khalti API error:", error);
        return res.status(400).json({ message: error.message });
      }

      if (response.statusCode === 200) {
        const responseData = JSON.parse(response.body);

        // Save the Khalti payment token (pidx) in the Order
        newOrder.payment_token = responseData.pidx;
        await newOrder.save();

        return res.status(200).json({
          pidx: responseData.pidx,
          payment_url: responseData.payment_url,
          message: "Payment initiated. Redirect user to payment_url.",
        });
      } else {
        return res
          .status(response.statusCode)
          .json({ message: response.body });
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ message: e.message });
  }
};


export const verifyPayment = async (req, res) => {
    try {
      const { pidx } = req.query;
      if (!pidx) {
        // Redirect to frontend with failure status if no pidx is provided
        return res.redirect("http://localhost:5173/?status=failed");
      }
  
      const order = await Order.findOne({ payment_token: pidx });
      if (!order) {
        return res.redirect("http://localhost:5173/?status=failed");
      }
  
      const headers = {
        Authorization: `Key ${process.env.KHALTI_KEY}`,
        "Content-Type": "application/json",
      };
  
      const response = await axios.post(
        "https://a.khalti.com/api/v2/epayment/lookup/",
        { pidx },
        { headers }
      );
  
      // Check if Khalti lookup indicates a completed payment
      if (response.status === 200 && response.data.status === "Completed") {
        order.paymentStatus = "Completed";
        await order.save();
        return res.redirect("http://localhost:5173/?status=success");
      } else {
        return res.redirect("http://localhost:5173/?status=failed");
      }
    } catch (error) {
      console.error("Khalti API Error:", error.response?.data || error.message);
      return res.redirect("http://localhost:5173/?status=failed");
    }
  };
  