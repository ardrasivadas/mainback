import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  email: { type: String, required: true }, // Store email instead of userId
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
    }
  ]
});
export default mongoose.model('Wishlist', wishlistSchema);

