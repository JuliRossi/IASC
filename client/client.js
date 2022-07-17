import { randomBytes } from "crypto";
import {createServer} from "http";
import { io as ioClient } from "socket.io-client";
import { createLoggerForService } from "../model/logger.js";
import express, {json} from "express";


const randomId = () => randomBytes(8).toString("hex");
const logger = createLoggerForService("client");
const currentAuctions = new Map();
const port = process.argv[2] || 8080;
const host = "http://localhost:" + port;
const orchestratorHost = process.argv[2] ? "http://localhost:8080" : "http://orchestrator:8080"

const app = express();
const server = createServer(app).listen(process.argv[2] || 8080);

app.use(json());


const socket = ioClient(orchestratorHost, {
  auth: { port, host, clientId: 124 },
  autoConnect: true,
});

socket.onAny((event, ...args) => {
  console.log(event, args);
});

socket.on("auction", (auction) => {
  console.log("New auction received, showing it now.");
  console.log(auction);
  currentAuctions.set(auction.id, auction);
});

socket.on("auctionBidModification", (auction) => {
  console.log("Auction has new bid, showing it: ");
  console.log(auction);
  currentAuctions.set(auction.id, auction);
});

socket.on("buyerInfo", (buyer) => {
  //Sending buyer info to the orchestrator.
  console.log(buyer);
});

export function emitBuyer(buyerInfo, res) {
  socket.emit("buyerInfo", buyerInfo, (serverSocketResponse) => {
    res.json(serverSocketResponse);
})
}

export function emitAuction(auction) {
  socket.emit("auctionCreationRequest", auction);
}

export function emitOffer(offer) {
  socket.emit("auctionBidPlaced", offer);
}

//socket.emit("doBid", {auctionId, bid})


//CreateBuyer o RegisterBuyer
app.post("/buyers", (req, res) => {
    emitBuyer(req.body, res)
});

app.get("/testing", (req, res) => {
  res.json("Using this endpoint to check if kubernetes service is reachable")
});

//CreateAuction
app.post("/bids", (req, res) => {
    emitAuction(req.body)
    res.sendStatus(200);
});

//CreateOffer
app.post("/offer", (req, res) => {
    emitOffer(req.body)
    res.sendStatus(200);
});