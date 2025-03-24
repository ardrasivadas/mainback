import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    place: { type: String, required: true },
    password: { type: String, required: true },
    cart: [{ productId: String, quantity: Number }],
    wishlist: [{ productId: String }],
});

export default mongoose.model("User", UserSchema);
