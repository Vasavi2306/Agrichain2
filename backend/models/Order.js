const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        buyerName: {
            type: String,
            required: true
        },

        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                productName: {
                    type: String,
                    required: true
                },

                farmerId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true
                },

                farmerName: {
                    type: String,
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true
                },

                unit: {
                    type: String,
                    required: true
                },

                price: {
                    type: Number,
                    required: true
                }
            }
        ],

        totalAmount: {
            type: Number,
            required: true
        },

        blockchainTransactions: [
    {
        productName: {
            type: String
        },
        transactionHash: {
            type: String
        },
        verified: {
            type: Boolean,
            default: false
        },
        verificationStatus: {
            type: String,
            default: "Pending"
        },
        blockNumber: {
            type: Number,
            default: null
        },
        verifiedAt: {
            type: Date,
            default: null
        }
    }
],

        status: {
            type: String,
            enum: [
                "Pending",
                "Confirmed",
                "Completed",
                "Cancelled"
            ],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);