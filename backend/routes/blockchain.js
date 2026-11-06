
const express = require("express");
const Order = require("../models/Order");

const {
    getTransactionCount,
    getTransaction,
    verifyTransaction
} = require("../blockchain/blockchainService");

const router = express.Router();


// ======================================
// 1. GET ALL BLOCKCHAIN TRANSACTIONS
// ======================================

router.get("/transactions", async (req, res) => {
    try {
        const count = await getTransactionCount();
        const blockchainTransactions = [];

        for (let i = 0; i < count; i++) {
            const transaction = await getTransaction(i);

            blockchainTransactions.push({
                blockchainIndex: i,
                ...transaction
            });
        }

        const orders = await Order.find().sort({ createdAt: -1 });

        const finalTransactions = blockchainTransactions.map(tx => {
            const txHash = (
                tx.transactionHash ||
                tx.hash ||
                ""
            ).toLowerCase();

            let matchedOrder = null;
            let matchedRecord = null;

            // Match using transaction hash
            for (const order of orders) {
                const record = order.blockchainTransactions?.find(item =>
                    item.transactionHash?.toLowerCase() === txHash
                );

                if (record) {
                    matchedOrder = order;
                    matchedRecord = record;
                    break;
                }
            }

            // Fallback match using order ID and product name
            if (!matchedRecord) {
                for (const order of orders) {
                    const blockchainOrderId = parseInt(
                        order._id.toString().slice(-8),
                        16
                    );

                    if (blockchainOrderId === tx.orderId) {
                        const record = order.blockchainTransactions?.find(
                            item =>
                                item.productName?.toLowerCase() ===
                                tx.productName?.toLowerCase()
                        );

                        if (record) {
                            matchedOrder = order;
                            matchedRecord = record;
                            break;
                        }
                    }
                }
            }

            return {
                ...tx,

                transactionHash:
                    matchedRecord?.transactionHash ||
                    tx.transactionHash ||
                    tx.hash ||
                    null,

                mongoOrderId: matchedOrder
                    ? matchedOrder._id.toString()
                    : null,

                verified: matchedRecord?.verified === true,

                verificationStatus:
                    matchedRecord?.verificationStatus || "Pending",

                blockNumber:
                    matchedRecord?.blockNumber ?? null,

                verifiedAt:
                    matchedRecord?.verifiedAt ?? null
            };
        });

        res.status(200).json({
            count: finalTransactions.length,
            transactions: finalTransactions
        });

    } catch (error) {
        console.error("Blockchain Transaction Error:", error);

        res.status(500).json({
            message: "Unable to fetch blockchain transactions.",
            error: error.message
        });
    }
});


// ======================================
// 2. VERIFY BLOCKCHAIN TRANSACTION
// ======================================

router.get("/verify/:transactionHash", async (req, res) => {
    try {
        const { transactionHash } = req.params;

        // Validate hash format
        if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
            return res.status(400).json({
                verified: false,
                status: "Invalid",
                message: "Invalid transaction hash."
            });
        }

        // Verify against blockchain
        const result = await verifyTransaction(transactionHash);

        if (
            !result ||
            result.status === "Not Found" ||
            result.status === "Pending" ||
            result.status === "Failed" ||
            result.status === "Invalid"
        ) {
            return res.status(
                result?.status === "Not Found" ? 404 : 200
            ).json({
                verified: false,
                ...result
            });
        }

        // Case-insensitive MongoDB hash matching
        const hashRegex = new RegExp(
            "^" + transactionHash + "$",
            "i"
        );

        const updatedOrder = await Order.findOneAndUpdate(
            {
                "blockchainTransactions.transactionHash": {
                    $regex: hashRegex
                }
            },
            {
                $set: {
                    "blockchainTransactions.$.verified": true,
                    "blockchainTransactions.$.verificationStatus": "Verified",
                    "blockchainTransactions.$.blockNumber":
                        result.blockNumber ?? null,
                    "blockchainTransactions.$.verifiedAt": new Date()
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        // Blockchain verification succeeded, but no order was matched
        if (!updatedOrder) {
            return res.status(404).json({
                verified: true,
                status: "Verified",
                savedToMongoDB: false,
                transactionHash,
                blockNumber: result.blockNumber ?? null,
                message:
                    "Transaction is on the blockchain, but its MongoDB order was not found."
            });
        }

        res.status(200).json({
            verified: true,
            status: "Verified",
            savedToMongoDB: true,
            transactionHash,
            blockNumber: result.blockNumber ?? null,
            verifiedAt:
                updatedOrder.blockchainTransactions.find(item =>
                    item.transactionHash?.toLowerCase() ===
                    transactionHash.toLowerCase()
                )?.verifiedAt,
            message: "Transaction verified and saved successfully."
        });

    } catch (error) {
        console.error("Blockchain Verification Error:", error);

        res.status(500).json({
            verified: false,
            status: "Error",
            message: "Unable to verify blockchain transaction.",
            error: error.message
        });
    }
});


// ======================================
// 3. EXPORT ROUTER
// ======================================

module.exports = router;
