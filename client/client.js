import { randomBytes } from "crypto";
import { io as ioClient } from "socket.io-client";
import { createLoggerForService } from "../model/logger.js";

const randomId = () => randomBytes(8).toString("hex");
const logger = createLoggerForService("");
const currentAuctions = new Map();
const port = process.argv[2];
const host = "http://localhost:" + port;

const clientSocket = ioClient("http://localhost:8080", {
  auth: { port, host, clientId: 124 },
  autoConnect: true,
});

clientSocket.onAny((event, ...args) => {
  console.log(event, args);
});

clientSocket.on("auction", (auction) => {
  console.log("New auction received, showing it now.");
  console.log(auction);
  currentAuctions.set(auction.id, auction);
});

clientSocket.on("auctionBidModification", (auction) => {
  console.log("Auction has new bid, showing it: ");
  console.log(auction);
  currentAuctions.set(auction.id, auction);
});

clientSocket.on("buyerInfo", (buyer) => {
  //Sending buyer info to the orchestrator.
  console.log(buyer);
});

export async function emitBuyer(buyerInfo, res) {
  clientSocket.emit("buyerInfo", buyerInfo, (response) => {
    res.json(response);
  });
}

export function emitAuction(auction) {
  clientSocket.emit("auctionCreationRequest", auction);
}

export function emitOffer(offer) {
  clientSocket.emit("auctionBidPlaced", offer);
}

//socket.emit("doBid", {auctionId, bid})
