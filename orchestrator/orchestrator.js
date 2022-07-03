import { randomBytes } from "crypto";
import { createServer } from "http";
import { Server } from "socket.io";
import { createLoggerForService } from "../model/logger.js";
import Nodo from "../model/nodo.js";

const logger = createLoggerForService("orchestrator");
// Use arg as port for connections, if not present then use 8080 as default.
const server = createServer().listen(process.argv[2] || 8080);
const io = new Server(server, {});

const nodes = new Map();
const serverRooms = new Map();
const tagRooms = new Map();
const defaultRoom = "room";

serverRooms.set(defaultRoom, []);

const randomId = () => randomBytes(8).toString("hex");

io.on("connection", (socket) => {
  if (socket.handshake.auth.clientId) {
    manageClientConnection(socket);
  } else {
    manageServerConnection(socket);
  }
  manageAuctionBids(socket);
  manageAuctions(socket);
});

function manageAuctions(socket) {
  socket.on("auctionCreationRequest", (auction) => {
    //Decide which servers will store this specific auction.
    io.to(defaultRoom).emit("auctionCreationRequest", auction);
  });

  socket.on("auctionCreated", (auction) => {
    //The auction was created we will inform the specific buyers.
    auction.tags.forEach((tag) => {
      io.to(tag).emit("auction", auction);
    });
  });
}
function manageAuctionBids(socket) {
  socket.on("auctionBidModification", (auction) => {
    logger.info(auction);
    auction.tags.forEach((tag) => {
      io.to(tag).emit("auctionBidModification", auction);
    });
  });

  socket.on("auctionBidPlaced", (auctionBid) => {
    //TODO update the specific rooms related to that auction.
    io.to(defaultRoom).emit("auctionBidPlaced", auctionBid);
  });
}

function addBuyerToRooms(buyerInfo, socket) {
  buyerInfo.tags.forEach((element) => {
    if (tagRooms.has(element)) {
      tagRooms.get(element).push(buyerInfo);
    } else {
      tagRooms.set(element, []);
      tagRooms.get(element).push(buyerInfo);
    }
    socket.join(element);
  });
}

function addBuyerToServers(buyerInfo) {
  io.to(defaultRoom).emit("newBuyer", buyerInfo);
}

function manageNewBuyer(socket) {
  socket.on("buyerInfo", (buyerInfo) => {
    logger.info("¡We have a new buyer now! ID: " + buyerInfo.buyerId);
    addBuyerToRooms(buyerInfo, socket);
    addBuyerToServers(buyerInfo);
    //TODO add the logic for sending the existing auctions to new buyers
  });
}

function manageClientConnection(socket) {
  // We derive the management to the specific function.
  manageNewBuyer(socket);

  socket.on("disconnect", () => {
    logger.warn("Client/Buyer disconected.");
  });
}

function manageServerConnection(socket) {
  // 1) New node connected to the orchestrator, so we tell the rest of it and we save it on our node list.
  const newNode = new Nodo(
      socket.nodeId,
      "Node" + socket.handshake.auth.port,
      socket.handshake.auth.host,
      socket.handshake.auth.port
  );

  //We send the Node object to the socket to let the server know which one is him.
  socket.emit("self", newNode);

  // We use broadcast to only send the new node the the previous existing sockets and not the new one
  socket.broadcast.emit("nodeConnection", newNode);

  // We use emit for sending the connected nodes to the new node.
  socket.emit("nodes", nodes);

  nodes.set(newNode.id, newNode);

  addToRoom(socket, newNode);

  socket.on("disconnect", () => {
    console.log("Node disconected:");
    console.log(nodes.get(socket.nodeId));
    nodes.delete(socket.nodeId);
  });
}

function addToRoom(socket, node) {
  //For now there will be only one room that all sockets will be added to.
  serverRooms.get(defaultRoom).push(node);
  socket.join(defaultRoom);
}

// Upon connection the nodeName is added for usage later
io.use((socket, next) => {
  const nodeId = socket.handshake.auth.nodeId;

  //This is kind of a reconnect tool, when the socket disconnects and reconnects the orchestrator will know that it is the same. This means the server still has all his data.
  if (nodeId) {
    const node = nodes.get(nodeId);
    if (node) {
      socket.nodeId = nodeId;
      return next();
    }
  }
  //If the node is not present then we create a new one
  socket.nodeId = randomId();
  return next();
});
