const mongoose = require('mongoose')
const Schema = mongoose.Schema

let Trade = new Schema({
    game: {type: String, required: true},
    player1: {type: String, unique: true, required: true},
    player2: {type: String, unique: true, required: true},
    player1cards: [{type: String, required: true}],
    player2cards: [{type: String, required: true}]
}, { collection: 'trades', timestamps: true });

module.exports = mongoose.model('Trade', Trade)