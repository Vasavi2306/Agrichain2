
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

const {
    authMiddleware,
    adminOnly
} = require("../middleware/authMiddleware");

// Protect all admin routes
router.use(authMiddleware, adminOnly);


// =========================
// DASHBOARD STATISTICS
// =========================

router.get("/stats", async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({
            role: { $in: ["farmer", "buyer"] }
        });

        const totalFarmers = await User.countDocuments({
            role: "farmer"
        });

        const totalBuyers = await User.countDocuments({
            role: "buyer"
        });

        const totalProducts = await Product.countDocuments();

        const totalOrders = await Order.countDocuments();

        res.json({
            totalUsers,
            totalFarmers,
            totalBuyers,
            totalProducts,
            totalOrders
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to load dashboard statistics",
            error: error.message
        });
    }
});


// =========================
// GET ALL FARMERS
// =========================

router.get("/farmers", async (req, res) => {
    try {
        const farmers = await User.find({
            role: "farmer"
        }).select("-password").sort({ createdAt: -1 });

        res.json({ farmers });

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch farmers",
            error: error.message
        });
    }
});


// =========================
// GET ALL BUYERS
// =========================

router.get("/buyers", async (req, res) => {
    try {
        const buyers = await User.find({
            role: "buyer"
        }).select("-password").sort({ createdAt: -1 });

        res.json({ buyers });

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch buyers",
            error: error.message
        });
    }
});


// =========================
// GET ALL PRODUCTS
// =========================

router.get("/products", async (req, res) => {
    try {
        const products = await Product.find().sort({
            createdAt: -1
        });

        res.json({ products });

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch products",
            error: error.message
        });
    }
});


// =========================
// GET ALL ORDERS
// =========================

router.get("/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({
            createdAt: -1
        });

        res.json({ orders });

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch orders",
            error: error.message
        });
    }
});


// =========================
// VIEW ONE FARMER PROFILE
// =========================

router.get("/farmer/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid farmer ID"
            });
        }

        const farmer = await User.findOne({
            _id: req.params.id,
            role: "farmer"
        }).select("-password");

        if (!farmer) {
            return res.status(404).json({
                message: "Farmer not found"
            });
        }

        res.json({ farmer });

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch farmer profile",
            error: error.message
        });
    }
});


// =========================
// VIEW ONE BUYER PROFILE
// =========================

router.get("/buyer/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid buyer ID"
            });
        }

        const buyer = await User.findOne({
            _id: req.params.id,
            role: "buyer"
        }).select("-password");

        if (!buyer) {
            return res.status(404).json({
                message: "Buyer not found"
            });
        }

        res.json({ buyer });

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch buyer profile",
            error: error.message
        });
    }
});


// Export router
module.exports = router;
