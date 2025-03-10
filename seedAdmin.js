import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from './models/Admin.js';

mongoose.connect('mongodb+srv://ardra:ardrac1543@cluster0.tehzzbx.mongodb.net/plantdb?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seedAdmin = async () => {
    const username = 'admin'; // Set your desired username
    const password = 'ardra'; // Set your desired password

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
        console.log('Admin already exists');
        mongoose.connection.close();
        return;
    }

    // Create new admin
    const admin = new Admin({
        username,
        password: hashedPassword
    });

    await admin.save();
    console.log('Admin created successfully');
    mongoose.connection.close();
};

seedAdmin().catch(err => console.log(err));
