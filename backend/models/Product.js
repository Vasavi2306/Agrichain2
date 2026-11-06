const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        farmerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        farmerName: {
            type: String,
            required: true
        },

        productName: {
            type: String,
            required: true
        },

        category: {
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
        },

        description: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.models.Product ||
    mongoose.model("Product", productSchema);