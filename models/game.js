const mongoose = require('mongoose')
const Schema = mongoose.Schema

let Game = new Schema({
    name: {type: String, required: true},
    playerCount: {type: Number, required: true},
    status: {type: String, required: true},
    winner: {type: String, required: false},
    history: [{type: String}],
    players: [{ type: Schema.ObjectId, ref: 'Player' }]
}, { collection: 'cardgames', timestamps: true });

module.exports = mongoose.model('Game', Game)