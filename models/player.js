const mongoose = require('mongoose')
const Schema = mongoose.Schema

let Player = new Schema({
    uid: {type: String, unique: true, required: true},
    name: {type: String, required: true},
    currentBid: {type: Number, required: true},
    cards: [{type: String}],
    activeTrade: { type: Schema.ObjectId, ref: 'Trade' }
}, { timestamps: true});

module.exports = mongoose.model('Player', Player)