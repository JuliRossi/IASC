import { randomBytes } from "crypto";
import { createServer } from "http";
import { Server } from "socket.io";
import { Node } from "./model.js";
// Use arg as port for connections, if not present then use 8080 as default.
const server = createServer().listen(process.argv[2] || 8080);
const io = new Server(server, {});
const randomId = () => randomBytes(8).toString("hex");

const nodes = new Map();

io.on("connection", (socket) => {

  // 1) New node connected to the orchestrator, so we tell the rest of it and we save it on our node list.
  var newNode = new Node(
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

  socket.on("disconnect", () => {
    console.log("Node disconected:");
    console.log(nodes.get(socket.nodeId));
    nodes.delete(socket.nodeId);
  });
});

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
