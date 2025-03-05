import axios from "axios";
import jwt from "jsonwebtoken";

import UserToken from "../models/usertokenModel.js";
import Order from "../models/OrderModel.js";
import OrderItem from "../models/orderItemModel.js";
import Product from "../models/productModel.js";

export const createOrder = async (req, res) => {
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
      paymentMethod,
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_zip,
    } = req.body;

    let totalPrice = 0;

    // Create a new Order document
    const newOrder = await Order.create({
      user: decoded.id,
      paymentStatus: "Pending",
      paymentMethod: paymentMethod || "Cash on Delivery",
      khalti_pidx: null,
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_zip,
      amount: 0,
    });

    // Loop through each item to create OrderItems and calculate total price
    for (let i = 0; i < items.length; i++) {
      const { product: productId, quantity } = items[i];
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      await OrderItem.create({
        order: newOrder._id, // link the order item to the order
        product: productId,
        quantity,
        user: decoded.id,
      });

      totalPrice += product.price * quantity;
    }

    const totalPriceInPaisa = totalPrice * 100;
    newOrder.amount = totalPriceInPaisa;
    await newOrder.save();

    if (paymentMethod === "Khalti") {
      const payload = {
        return_url: "http://localhost:5000/api/order/verify-payment",
        website_url: "http://localhost:5000",
        amount: totalPriceInPaisa,
        purchase_order_id: `ORDER_${newOrder._id}`,
        purchase_order_name: `Order ${newOrder._id}`,
        customer_info: {
          name: shipping_name || "Unknown",
          email: "",
          phone: shipping_phone || "",
        },
      };

      const headers = {
        Authorization: `Key ${process.env.KHALTI_KEY}`,
        "Content-Type": "application/json",
      };

      try {
        const khaltiResponse = await axios.post(
          "https://a.khalti.com/api/v2/epayment/initiate/",
          payload,
          { headers }
        );
        if (khaltiResponse.status === 200) {
          const { pidx } = khaltiResponse.data;
          newOrder.khalti_pidx = pidx;
          await newOrder.save();

          return res.status(200).json(khaltiResponse.data);
        } else {
          return res.status(khaltiResponse.status).json(khaltiResponse.data);
        }
      } catch (err) {
        console.error("Khalti init error:", err.message);
        return res.status(500).json({
          message: "Failed to initiate payment with Khalti.",
          details: err.message,
        });
      }
    } else {
      return res.status(200).json({
        message: "Order created successfully (Cash on Delivery).",
        orderId: newOrder._id,
      });
    }
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(400).json({ message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { pidx } = req.query;
    if (!pidx) {
      return res.redirect("http://localhost:5173/");
    }

    const order = await Order.findOne({ khalti_pidx: pidx });
    if (!order) {
      return res.redirect("http://localhost:5173/");
    }

    const lookupUrl = "https://a.khalti.com/api/v2/epayment/lookup/";
    const headers = {
      Authorization: `Key ${process.env.KHALTI_KEY}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(lookupUrl, { pidx }, { headers });

    if (response.status === 200) {
      const data = response.data;
      if (data.status === "Completed") {
        order.paymentStatus = "Completed";
        await order.save();
        return res.redirect(`http://localhost:5173/payment-success?order_id=${order._id}`);
      } else {
        return res.redirect("http://localhost:5173/");
      }
    } else {
      return res.redirect("http://localhost:5173/");
    }
  } catch (error) {
    console.error("Khalti lookup error:", error.message);
    return res.redirect("http://localhost:5173/");
  }
};

export const getOrderHistory = async (req, res) => {
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

    const orders = await Order.find({
      user: decoded.id,
      paymentStatus: "Completed",
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "username email",
      })
      .populate({
        path: "items",
        populate: { path: "product", select: "title price" },
      });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("getOrderHistory error:", error);
    return res.status(400).json({ message: error.message });
  }
};
