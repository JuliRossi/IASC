import { Server } from "socket.io";
import express, { json } from 'express';
const app = express();
import { createServer } from 'http';
const server = createServer(app);
const io = new Server(server);
import { getTagsFromBuyerId, getActiveAuctionsFromTags, getAuctionFromAuctionId, getAuctionWinnerFromAuctionId } from "./methods.js";

var count = 1;
var auctions = []
var buyers = []

io.on("connection", (socket) => {
    // send a message to the client
    console.log("Se conecto un cliente")

    socket.emit("hello from server", "Sos el cliente", count++);

    // receive a message from the client
    socket.on("hello from client", (arg1,arg2) => {
        console.log(arg1 + " " + arg2)
    });

    socket.on('disconnect', () => {
        console.log('user');
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
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
app.post('/buyers', (req, res) => {
    var buyer = req.body;
    buyers.push(buyer);
    res.json(req.body);
    console.log(req.body)
});


/*
{
    "tags": [],
    "buyer_id": 1,
    "base_price": 0,
    "max_duration": 5,
    "item": {}
}
*/
app.post('/bids', (req, res) => {
    var auction = req.body;
    var now = new Date();
    var newAuction = {
        auctionId : 1,
        tags: auction.tags,
        currentPrice: parseInt(auction.basePrice),
        buyerId: parseInt(auction.buyerId),
        auctionStart: now,
        auctionClose: new Date(now.getMinutes + parseInt(auction.maxDuration)),
        active: true,
        item: auction.item,
    }
    auctions.push(newAuction);
    res.json(req.body);
    console.log(req.body);
});

/*
[
    {
        "auction_id": 1,
        "tags": [],
        "current_price": 0,
        "buyer_id": -1,
        "auction_start": "2022/06/26 23:59:59.000",
        "auction_close": "2022/06/27 00:04:59.000",
        "active": true,
        "item": {}
    }
]
*/
app.get('/auctions', (req, res) => {
    var buyerId = parseInt(req.query.buyerId);
    console.log(req.query.buyerId);
    console.log(buyerId);
    var tags = getTagsFromBuyerId(buyerId, buyers); //TO-DO
    res.json(getActiveAuctionsFromTags(tags, auctions)); //TO-DO
});

/*
{
    "auction_id": 1,
    "offer_price": 0,
    "buyer_id": 1
}
*/
app.post('/offer', (req, res) => {
    var offer = req.body;
    var auction = getAuctionFromAuctionId(parseInt(offer.auctionId), auctions);
    if(parseInt(offer.offerPrice) > auction.currentPrice) {
        auction.currentPrice = parseInt(offer.offerPrice)
        auction.buyerId = parseInt(offer.buyerId)
        res.send("offer accepted");
    } else {
        res.send("offer is lower or equal than current offer of price: " + auction.currentPrice);
    }
});

/*
{
    "auction_id": 1,
    "final_price": 100,
    "buyer_id": 1,
    "item": {}
}
*/
app.get('/winner', (req, res) => {
    var auctionId = req.query.auctionId;
    res.json(getAuctionWinnerFromAuctionId(parseInt(auctionId), auctions)); //TO-DO
});