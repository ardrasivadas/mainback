import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  email: { type: String, required: true }, 
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true, default: 1 }
    }
  ]
});


export default mongoose.model("Cart", cartSchema);