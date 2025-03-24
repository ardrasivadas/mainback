import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 👈 `user` is required
  email: { type: String, required: true },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
    }],
  totalAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' }
});

export default mongoose.model("Order", OrderSchema);


