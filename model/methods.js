import pkg from 'lodash';
import _ from "lodash";

export function getTagsFromBuyerId(buyerId, buyers){
    console.log(buyers);
    const client = _.find(buyers, {'buyerId': buyerId});
    console.log(client);
    return client.tags;
}

export function getActiveAuctionsFromTags(tags, auctions){
    return _.filter(auctions, function(a) { 
        return _.some(tags, function(t) { 
            return _.includes(a.tags, t)
        } )
    } )
}

export function getAuctionFromAuctionId(auctionId, auctions) {
    return _.find(auctions, { 'auctionId': auctionId})
}

export function getAuctionWinnerFromAuctionId(auctionId, auctions) {
    const auction = getAuctionFromAuctionId(auctionId, auctions);
    if(!auction.active){
        return {
            auctionId: auction.auctionId,
            finalPrice: auction.currentPrice,
            buyerId: auction.buyerId,
            item: auction.item,
        }
    }
    return "auction is still active";
}