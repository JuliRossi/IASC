import { randomBytes } from "crypto";
import { createServer } from "http";
import { Server } from "socket.io";
import Buyer from "../model/buyer.js";
import { createLoggerForService } from "../model/logger.js";
import Nodo from "../model/nodo.js";

const logger = createLoggerForService("orchestrator");
// Use arg as port for connections, if not present then use 8080 as default.
const server = createServer().listen(process.argv[2] || 8080);
const io = new Server(server, {});

const servers = new Map();
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

/**
 * Expects messages from client or servers, process them and broadcast
 * to specific rooms.
 * 
 * @param  socket
 */
function manageAuctions(socket) {
  socket.on("auctionCreationRequest", (auction) => {
    //Decide which servers will store this specific auction.

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

    io.to(defaultRoom).emit("auctionCreationRequest", newAuction);
  });

  socket.on("auctionCreated", (auction) => {
    //The auction was created we will inform the specific buyers.
    auction.tags.forEach((tag) => {
      io.to(tag).emit("auction", auction);
    });
  });
}

/**
 * Expects a new bid or a modification in one of the auctions to
 * send that information to clients or servers.
 *
 * @param socket - represents a server socket
 */
function manageAuctionBids(socket) {
  socket.on("auctionBidModification", (auction) => {
    logger.info(`Received modification for auction ${auction.id}`);
    auction.tags.forEach((tag) => {
      io.to(tag).emit("auctionBidModification", auction);
    });
  });

  socket.on("auctionBidPlaced", (auctionBid) => {
    //TODO update the specific rooms related to that auction.
    io.to(defaultRoom).emit("auctionBidPlaced", auctionBid);
  });
}

/**
 * Adds the buyer specific socket to rooms based on its tags.
 *
 * @param buyerInfo - buyerInfo is a buyer object
 * @param socket - client socket that will receive the auctions updates
 */
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

/**
 * Adds the specific buyer to the servers. (It sends it to them)
 * Buyers are replicated across all the servers.
 *
 * @param buyerInfo  - buyerInfo contains a buyer object
 */
function addBuyerToServers(buyerInfo) {
  io.to(defaultRoom).emit("newBuyer", buyerInfo);
}

/**
 * Asks the client for the buyer info and using that info a new buyer is generated.
 * Also sets the buyer rooms and adds it to the servers.
 * Specific logic for receiving auctions is added here.
 *  * @param socket - socket that will be used to manage the new buyer
 */
function manageNewBuyer(socket) {
  socket.on("buyerInfo", (buyerInfo, callback) => {
    const newBuyer = new Buyer(randomId(), buyerInfo.name, buyerInfo.tags);
    logger.info(`New buyer added to the service, id: ${newBuyer.id}`);
    addBuyerToRooms(buyerInfo, socket);
    addBuyerToServers(buyerInfo);
    //TODO add the logic for sending the existing auctions to new buyers
    callback(newBuyer);
  });
}

/**
 * Manages the connection of a new client.
 *
 * @param socket - socket that will be used to manage the client connection
 */
function manageClientConnection(socket) {
  // We derive the management to the specific function.
  manageNewBuyer(socket);

  socket.on("disconnect", () => {
    logger.warn("Client/Buyer disconected.");
  });
}

/**
 * Manages a socket as a server connection, first checks the previous existence of the Node
 * and then generates the correct values depending on the response.
 * Also sets the socket to specific rooms and sets a disconnect function.
 *
 * @param socket - socket that will be used to manage the server connection
 */
function manageServerConnection(socket) {
  let nodeConnected = new Nodo();

  socket.emit("checkPreviousExistence");

  socket.on("existentNode", ({ self, auctions, buyers }) => {
    logger.info(
      `Node ${self.id} is reconnecting, processing auctions and buyers.`
    );
    nodeConnected = self;
    //TODO resolve auctions and buyers
  });

  socket.on("nonExistentNode", ({ port, host }) => {
    logger.info(`New Node ${socket.nodeId} added to the service.`);
    nodeConnected = new Nodo(socket.nodeId, "Node" + port, host, port);
    socket.emit("self", nodeConnected);
  });

  servers.set(nodeConnected.id, nodeConnected);

  addToRoom(socket, nodeConnected);

  socket.on("disconnect", () => {
    logger.info(`Node ${socket.nodeId} disconnected.`);
    servers.delete(socket.nodeId);
  });
}

/**
 * Adds the socket to the specific room and also adds the node to the list that relates nodes with rooms.
 *
 * @param socket - socket that will be added to the rooms
 * @param node - object that contains the node information, will be associated with a room
 */
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
    const node = servers.get(nodeId);
    if (node) {
      socket.nodeId = nodeId;
      return next();
    }
  }
  //If the node is not present then we create a new one
  socket.nodeId = randomId();
  return next();
});
