import { randomBytes } from "crypto";
import express, { json } from "express";
import { createServer } from "http";
import { io as ioClient } from "socket.io-client";
const randomId = () => randomBytes(8).toString("hex");

import { createLoggerForService } from "../model/logger.js";
import { Buyer } from "../model/model.js";

const logger = createLoggerForService("");


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

socket.on("buyerInfo", (buyer) => {
  //Sending buyer info to the orchestrator.
  console.log(buyer)
});

//socket.emit("doBid", {auctionId, bid})



export default {socket}


