
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected!");

        const adminEmail = "admin@agrichain.com";

        // Check whether admin already exists
        const existingAdmin = await User.findOne({
            email: adminEmail
        });

        if (existingAdmin) {
            console.log("Admin account already exists.");
            return;
        }

        // Hash admin password
        const hashedPassword = await bcrypt.hash(
            "AgriAdmin@2026",
            12
        );

        // Create admin
        const admin = new User({
            name: "AgriChain Admin",
            email: adminEmail,
            phone: "9999999999",
            role: "admin",
            password: hashedPassword
        });

        await admin.save();

        console.log("Admin account created successfully!");

    } catch (error) {
        console.log("Admin creation failed:", error.message);

    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();