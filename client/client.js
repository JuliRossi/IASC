import { randomBytes } from "crypto";
import express, { json } from "express";
import { createServer } from "http";
import { io as ioClient } from "socket.io-client";
const randomId = () => randomBytes(8).toString("hex");

import { createLoggerForService } from "../logger.js";

const logger = createLoggerForService("client");

var currentAuctions = new Map();

const app = express();
// Use arg as port for connections, if not present then use 8080 as default.
const server = createServer(app).listen(process.argv[2] || 8080);

var port = process.argv[2];
var host = "http://localhost:" + port;

const socket = ioClient("http://localhost:8080", {
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

socket.on("buyerInfo", () => {
  //Sending buyer info to the orchestrator.
  var buyerId = randomId();
  var tags = ["tag1", "tag2"];
  socket.emit("buyerInfo", { buyerId, tags });
});

//socket.emit("doBid", {auctionId, bid})

app.use(json());
/*
{
    "name": "something",
    "ip":"127.0.0.1:3001",
    "tags":[
        "watches",
        "electronics"
    ]
} */
app.post("/buyers", (req, res) => {
  var buyer = req.body;
  socket.emit("buyerInfo", buyer)
  res.json(req.body);
});


/*
{
    "tags": [],
    "buyerId": 1,
    "basePrice": 0,
    "maxDuration": 5,
    "item": {}
}
*/
app.post("/bids", (req, res) => {
  var auction = req.body;
  socket.emit("auctionCreationRequest", auction)
  res.status(201);
});


/*
{
    "auctionId": 1,
    "offerPrice": 0,
    "buyerId": 1
}
*/
app.post("/offer", (req, res) => {
  var offer = req.body;
  socket.emit("auctionBidPlaced", offer)
  res.send(202);
});



