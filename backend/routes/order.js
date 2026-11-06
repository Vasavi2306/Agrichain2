const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { recordTransaction } = require("../blockchain/blockchainService");

const router = express.Router();

// =====================================
// TEST ORDER ROUTE
// =====================================

router.get("/test", (req, res) => {
    res.json({
        message: "Order routes are working!"
    });
});


// =====================================
// PLACE ORDER
// =====================================

router.post("/place", async (req, res) => {
    try {
        const {
            buyerId,
            buyerName,
            products,
            totalAmount
        } = req.body;

        if (!buyerId || !buyerName || !products || !products.length || totalAmount == null) {
            return res.status(400).json({
                message: "Please provide all required order details."
            });
        }

        if (!mongoose.Types.ObjectId.isValid(buyerId)) {
            return res.status(400).json({
                message: "Invalid buyer ID."
            });
        }

        const order = new Order({
            buyerId,
            buyerName,
            products,
            totalAmount,
            status: "Pending"
        });

        await order.save();

        const blockchainOrderId = Number(
            parseInt(order._id.toString().slice(-8), 16)
        );

        const blockchainTransactions = [];

        for (const product of products) {
            try {
                const txHash = await recordTransaction(
                    blockchainOrderId,
                    product.productName,
                    product.farmerName,
                    buyerName,
                    Number(product.quantity),
                    Number(product.price)
                );

                blockchainTransactions.push({
                    productName: product.productName,
                    transactionHash: txHash
                });
            } catch (blockchainError) {
                console.error(
                    "Blockchain transaction error:",
                    blockchainError
                );
            }
        }

        order.blockchainTransactions = blockchainTransactions;
        await order.save();

        res.status(201).json({
            message: "Order placed successfully!",
            order
        });

    } catch (error) {
        console.error("Place Order Error:", error);

        res.status(500).json({
            message: "Unable to place order.",
            error: error.message
        });
    }
});


// =====================================
// GET BUYER ORDERS
// =====================================

router.get("/buyer/:buyerId", async (req, res) => {
    try {
        const { buyerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(buyerId)) {
            return res.status(400).json({
                message: "Invalid buyer ID."
            });
        }

        const orders = await Order.find({
            buyerId
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error("Get Buyer Orders Error:", error);

        res.status(500).json({
            message: "Unable to fetch buyer orders."
        });
    }
});


// =====================================
// GET FARMER ORDERS
// =====================================

router.get("/farmer/:farmerId", async (req, res) => {
    try {
        const { farmerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(farmerId)) {
            return res.status(400).json({
                message: "Invalid farmer ID."
            });
        }

        const orders = await Order.find({
            "products.farmerId": farmerId
        }).sort({
            createdAt: -1
        });

        const farmerOrders = orders.map(order => ({
            _id: order._id,
            buyerId: order.buyerId,
            buyerName: order.buyerName,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,

            products: order.products.filter(product =>
                product.farmerId.toString() === farmerId
            ),

            blockchainTransactions: order.blockchainTransactions
        }));

        res.status(200).json({
            count: farmerOrders.length,
            orders: farmerOrders
        });

    } catch (error) {
        console.error("Get Farmer Orders Error:", error);

        res.status(500).json({
            message: "Unable to fetch farmer orders."
        });
    }
});


// =====================================
// GET ORDER STATUS
// =====================================

router.get("/status/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                message: "Invalid order ID."
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        res.status(200).json({
            orderId: order._id,
            status: order.status
        });

    } catch (error) {
        console.error("Get Order Status Error:", error);

        res.status(500).json({
            message: "Unable to fetch order status."
        });
    }
});


// =====================================
// GET ALL ORDERS
// =====================================

router.get("/all", async (req, res) => {
    try {
        const orders = await Order.find().sort({
            createdAt: -1
        });

        res.status(200).json({
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error("Get All Orders Error:", error);

        res.status(500).json({
            message: "Unable to fetch orders."
        });
    }
});


// =====================================
// CONFIRM ORDER
// =====================================

router.put("/confirm/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                message: "Invalid order ID."
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status: "Confirmed" },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        res.status(200).json({
            message: "Order confirmed successfully!",
            order
        });

    } catch (error) {
        console.error("Confirm Order Error:", error);

        res.status(500).json({
            message: "Unable to confirm order."
        });
    }
});


// =====================================
// COMPLETE ORDER
// =====================================

router.put("/complete/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                message: "Invalid order ID."
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status: "Completed" },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        res.status(200).json({
            message: "Order completed successfully!",
            order
        });

    } catch (error) {
        console.error("Complete Order Error:", error);

        res.status(500).json({
            message: "Unable to complete order."
        });
    }
});


// =====================================
// CANCEL ORDER
// =====================================

router.put("/cancel/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                message: "Invalid order ID."
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status: "Cancelled" },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        res.status(200).json({
            message: "Order cancelled successfully!",
            order
        });

    } catch (error) {
        console.error("Cancel Order Error:", error);

        res.status(500).json({
            message: "Unable to cancel order."
        });
    }
});


// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;