class Auction {
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

export default Auction;
