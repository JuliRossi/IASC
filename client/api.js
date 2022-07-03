import express, {json} from "express";
import {createServer} from "http";
import Buyer from "../model/buyer.js";
import {emitAuction, emitBuyer, emitOffer} from "./client.js";

const logger = createLoggerForService("client");

const app = express();
// Use arg as port for connections, if not present then use 8080 as default.
const server = createServer(app).listen(process.argv[2] || 8080);

const port = process.argv[2];
const host = "http://localhost:" + port;

app.use(json());

//CreateBuyer o RegisterBuyer
app.post("/buyers", (req, res) => {
    emitBuyer(req.body)
    res.sendStatus(200)
    //TODO: Ask Nico
    /*
        socket.emit("buyerInfo", req.body, (serverSocketResponse) => {
            console.log(serverSocketResponse)
            buyer = serverSocketResponse;
            res.json(serverSocketResponse);
        })
    */
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