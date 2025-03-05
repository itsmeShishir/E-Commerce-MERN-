import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Khalti", "Cash on Delivery"],
      default: "Cash on Delivery",
    },
    khalti_pidx: {
      type: String,
      unique: true,
      sparse: true,
    },
    payment_token: {
      type: String,
      unique: true,
      sparse: true,
    },
    shipping_name: { type: String },
    shipping_phone: { type: String },
    shipping_address: { type: String },
    shipping_city: { type: String },
    shipping_state: { type: String },
    shipping_zip: { type: String },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
