const mongoose = require('mongoose')
const Schema = mongoose.Schema

let Trade = new Schema({
    player1: {type: String, unique: true, required: true},
    player2: {type: String, unique: true, required: true},
    player1cards: [{type: String, required: true}],
    player2cards: [{type: String, required: true}]
}, { timestamps: true});

module.exports = mongoose.model('Trade', Trade)