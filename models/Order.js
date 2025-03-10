import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  name: String,
  email: String,
  address: String,
  plantName: String,
  quantity: Number,
});

const Order = mongoose.model("Order", OrderSchema);
export default Order;
