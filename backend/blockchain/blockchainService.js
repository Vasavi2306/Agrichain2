
const { ethers } = require("ethers");
const { provider, abi } = require("./connection");

const contractAddress = process.env.CONTRACT_ADDRESS;

const contract = new ethers.Contract(
    contractAddress,
    abi,
    provider
);


// Get total blockchain transaction count
async function getTransactionCount() {

    const count = await contract.getTransactionCount();

    return Number(count);
}


// Get individual blockchain transaction
async function getTransaction(index) {

    const transaction = await contract.getTransaction(index);

    return {
        orderId: Number(transaction[0]),
        productName: transaction[1],
        farmerName: transaction[2],
        buyerName: transaction[3],
        quantity: Number(transaction[4]),
        price: Number(transaction[5]),
        timestamp: Number(transaction[6])
    };
}


// Record a new transaction on blockchain
async function recordTransaction(
    orderId,
    productName,
    farmerName,
    buyerName,
    quantity,
    price
) {

    const accounts = await provider.send("eth_accounts", []);

    if (!accounts || accounts.length === 0) {
        throw new Error("No Hardhat accounts available.");
    }

    const signer = await provider.getSigner(accounts[0]);

    const writableContract = new ethers.Contract(
        contractAddress,
        abi,
        signer
    );

    const tx = await writableContract.recordTransaction(
        orderId,
        productName,
        farmerName,
        buyerName,
        quantity,
        price
    );

    const receipt = await tx.wait();

    if (receipt.status !== 1) {
        throw new Error("Blockchain transaction execution failed.");
    }

    return tx.hash;
}


// Verify transaction using actual blockchain receipt
async function verifyTransaction(transactionHash) {

    const transaction = await provider.getTransaction(transactionHash);

    if (!transaction) {

        return {
            status: "Not Found",
            message: "Transaction does not exist on blockchain."
        };
    }

    const receipt = await provider.getTransactionReceipt(transactionHash);

    if (!receipt) {

        return {
            status: "Pending",
            transactionHash,
            message: "Transaction is waiting to be mined."
        };
    }

    return {

        status: receipt.status === 1 ? "Verified" : "Failed",

        transactionHash: receipt.hash,

        blockNumber: receipt.blockNumber,

        blockHash: receipt.blockHash,

        receiptStatus: receipt.status,

        from: receipt.from,

        to: receipt.to,

        gasUsed: receipt.gasUsed.toString()
    };
}


module.exports = {
    contract,
    getTransactionCount,
    getTransaction,
    recordTransaction,
    verifyTransaction
};
