
const logger = createLoggerForService("client");

var currentAuctions = new Map();
var buyer = new Buyer();
const app = express();
// Use arg as port for connections, if not present then use 8080 as default.
const server = createServer(app).listen(process.argv[2] || 8080);

var port = process.argv[2];
var host = "http://localhost:" + port;


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

  socket.emit("buyerInfo", req.body, (response) => {
    console.log(response)
    buyer = response;
    res.json(response);
  })

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
  res.sendStatus(201);
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
  res.sendStatus(202);
});