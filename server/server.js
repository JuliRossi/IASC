import {randomBytes} from "crypto";

import {createServer} from "http";
import {Server} from "socket.io";
import {io as ioClient} from "socket.io-client";
import {createLoggerForService} from "../model/logger.js";
import Auction from "../model/auction.js";
import Buyer from "../model/buyer.js";
import Nodo from "../model/nodo.js";

const logger = createLoggerForService("server");
// Use arg as port for connections, if not present then use 8080 as default.
const server = createServer().listen(process.argv[2] || 8080);
const io = new Server(server, {});
const randomId = () => randomBytes(8).toString("hex");

const port = process.argv[2];
const host = "http://localhost:" + port;
const buyers = new Map();
let self = new Nodo();
let auctions = new Map();
const socket = ioClient("http://localhost:8080", {
    auth: {port, host},
    autoConnect: true,
});

socket.onAny((event, ...args) => {
    console.log(event, args);
});

socket.on("self", (node) => {
    self = node;
});

socket.on("auctionCreationRequest", (auction) => {
    const now = new Date();
    const newAuction = new Auction(
        randomId(),
        auction.tags,
        parseInt(auction.basePrice),
        buyers.get(auction.buyerId),
        now,
        new Date(now.getMinutes + parseInt(auction.maxDuration)),
        true,
        auction.item
    );

    auctions.set(newAuction.id, newAuction);

    logger.info("New auction stored. ID: " + newAuction.id);
});

socket.on("auctionBidPlaced", (offer) => {
    const auction = auctions.get(offer.auctionId);
    logger.info("New offer received for auction: " + auction);
    if (auction.price < offer.offer) {
        logger.info("Offer accepted!");
        auction.price = offer.offer;
        auction.buyer = buyers.get(offer.buyerId);
        socket.emit("auctionBidModification", auction);
    }
});

socket.on("newBuyer", (buyerInfo) => {
    const newBuyer = new Buyer(randomId, buyerInfo.name, buyerInfo.tags);
    buyers.set(newBuyer.id, newBuyer);
    logger.info("Buyer added to the system.")
});
