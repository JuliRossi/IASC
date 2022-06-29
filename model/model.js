export class Node {
  constructor(id, name, host, port) {
    this.id = id;
    this.name = name;
    this.host = host;
    this.port = port;
  }

  getId() {
    return this.id;
  }
  getName() {
    return this.name;
  }

  getHost() {
    return this.host;
  }

  getPort() {
    return this.port;
  }
}
export class Buyer {
  constructor(id, name, tags) {
    this.id = id;
    this.name = name;
    this.tags = tags;
  }
}
export class Auction {
  constructor(id, tags, price, buyer, startTime, closeTime, active, item) {
    this.id = id;
    this.tags = tags;
    this.price = price;
    this.buyer = buyer;
    this.startTime = startTime;
    this.closeTime = closeTime;
    this.active = active;
    this.item = item;
  }
}
