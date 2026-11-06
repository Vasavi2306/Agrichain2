const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =========================
// REGISTER FARMER / BUYER / ADMIN
// =========================

router.post("/register", async (req, res) => {
    try {
        const { name, email, phone, role, password } = req.body;

        // Check required fields
        if (!name || !email || !phone || !role || !password) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        // Validate role
        if (!["farmer", "buyer", "admin"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        // Check whether email already exists
        const existingUser = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered. Please login."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            role: role,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(201).json({
            message: "Registration successful! You can now login."
        });

    } catch (error) {
        console.log("Registration Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already registered."
            });
        }

        return res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});


// =========================
// LOGIN FARMER / BUYER / ADMIN
// =========================

router.post("/login", async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Email, password and role are required"
            });
        }

        if (!["farmer", "buyer", "admin"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (user.role !== role) {
            return res.status(401).json({
                message: "Selected role does not match this account"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        return res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.log("Login Error:", error);

        return res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});

module.exports = router;