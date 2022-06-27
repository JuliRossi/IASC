import express, { json } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { io as ioClient } from "socket.io-client";
import { Node } from "./model.js";

import {
    getActiveAuctionsFromTags,
    getAuctionFromAuctionId,
    getAuctionWinnerFromAuctionId,
    getTagsFromBuyerId
} from "./methods.js";
const app = express();
// Use arg as port for connections, if not present then use 8080 as default.
const server = createServer(app).listen(process.argv[2] || 8080);
const io = new Server(server, {});

var port = process.argv[2];
var host = "http://localhost:" + port;
var count = 1;
var auctions = [];
var buyers = [];
let self = new Node();
const socket = ioClient("http://localhost:8080", {
  auth: { port, host },
  autoConnect: true,
});

socket.onAny((event, ...args) => {
  console.log(event, args);
});

socket.on("nodes", (nodes) => {});

socket.on("self", (node) => {
  self = node;
});

socket.on("nodeConnection", (node) => {
  // On new node lets exchange some information.
  console.log("Trying to connect to: " + node.host );
  const nodeSocket = ioClient(node.host, {
    autoConnect: true,
  });

  nodeSocket.onAny((event, ...args) => {
    console.log(event, args);
  });
  nodeSocket.emit("transfer", self);
});

io.on("connection", (socket) => {
  //We assume that we will be receiving some data from the nodes that are connecting.
  socket.on("transfer", (node) => {
    console.log("Transfer received from another node");
    console.log(node);
  });

  socket.on("disconnect", () => {
    console.log("Node disconected");
  });
});

app.use(json());

/*
{
    "buyerId":1,
    "ip":"127.0.0.1:3001",
    "tags":[
        "watches",
        "electronics"
    ]
}
*/
app.post("/buyers", (req, res) => {
  var buyer = req.body;
  buyers.push(buyer);
  res.json(req.body);
  console.log(req.body);
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
  var now = new Date();
  var newAuction = {
    auctionId: 1,
    tags: auction.tags,
    currentPrice: parseInt(auction.basePrice),
    buyerId: parseInt(auction.buyerId),
    auctionStart: now,
    auctionClose: new Date(now.getMinutes + parseInt(auction.maxDuration)),
    active: true,
    item: auction.item,
  };
  auctions.push(newAuction);
  res.json(req.body);
  console.log(req.body);
});

/*
[
    {
        "auctionId": 1,
        "tags": [],
        "currentPrice": 0,
        "buyerId": -1,
        "auctionStart": "2022/06/26 23:59:59.000",
        "auctionClose": "2022/06/27 00:04:59.000",
        "active": true,
        "item": {}
    }
]
*/
app.get("/auctions", (req, res) => {
  var buyerId = parseInt(req.query.buyerId);
  console.log(req.query.buyerId);
  console.log(buyerId);
  var tags = getTagsFromBuyerId(buyerId, buyers); //TO-DO
  res.json(getActiveAuctionsFromTags(tags, auctions)); //TO-DO
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
  var auction = getAuctionFromAuctionId(parseInt(offer.auctionId), auctions);
  if (parseInt(offer.offerPrice) > auction.currentPrice) {
    auction.currentPrice = parseInt(offer.offerPrice);
    auction.buyerId = parseInt(offer.buyerId);
    res.send("offer accepted");
  } else {
    res.send(
      "offer is lower or equal than current offer of price: " +
        auction.currentPrice
    );
  }
});

/*
{
    "auctionId": 1,
    "finalPrice": 100,
    "buyerId": 1,
    "item": {}
}
*/
app.get("/winner", (req, res) => {
  var auctionId = req.query.auctionId;
  res.json(getAuctionWinnerFromAuctionId(parseInt(auctionId), auctions)); //TO-DO
});
