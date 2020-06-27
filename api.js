const app = require('express')
const router = app.Router()

let Game = require('./models/game')
let Player = require('./models/player')
let Trade = require('./models/trade')

function createDeck(playerCount, handSize)
{
    const suits = ["basilisk","centaurus","chimera","hippogriff","manticore","medusa","pegasus","phoenix"];
    shuffle(suits);
    const deck = []
    for (var x = 0; x < playerCount; x++)
        for (var y = 1; y <= handSize; y++)
            deck.push(y + "-" + suits[x])

    shuffle(deck);
    return deck;
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function handle(res, err, data)
{
    if (err) {
        console.log(err);
        res.status(500).json({ message: JSON.stringify(err)});
    }
    else
        res.status(200).json(data);
}

router.route('/games/:id').get((req, res, next) => {
    Game.findById(req.params.id, (error, data) => {
        handle(res, error, data);
    });
});

router.route('/games').post((req, res, next) => {
    Game.create(
        { name: req.body.name, playerCount: req.body.playerCount, status: "NotStarted" }, 
        (error, data) => handle(res, error, data)
    );
});

router.route('/games/:id/join').post((req, res, next) => {
    Player.findOneAndUpdate(
        { uid: req.params.id + '.' + req.body.name },
        {
            uid: req.params.id + '.' + req.body.name,
            name: req.body.name,
            currentBid: 0,
            activeTrade: null
        },
        { upsert: true, new: true },
        (err, player) => {
            if (err) handle(res, err, {});
            else {
                Game.updateOne(
                    {_id: req.params.id},
                    { $push: { players: player } },
                    (error, data) => handle(res, error, player));
            }
        }
    );
});

router.route('/games/:id/start').post((req, res, next) => {
    Game.findByIdAndUpdate(
      req.params.id,
      { status: "Running" },
      { new: true},
      async (error, game) => {
        if (error) { handle(res, error, {}); return; }

        const handSize = 9;
        const deck = createDeck(game.playerCount, handSize);
        const playerid = 0;
        await Promise.all(game.players.forEach(async (pid) => {
            await Player.findByIdAndUpdate(
                pid,
                { cards: deck.slice(playerid * handSize, playerid * handSize + handSize) },
                (error, game) => {
                    if (error) handle(res, error, game); // THIS WOULD SUCK
                }
            ).exec();
            playerid++;
        }));

        handle(res, null, {});
    });
});

router.route('/players/:id').get((req, res, next) => {
    if (req.params.id == "me")
    {
        const playerid = req.cookies.playerid;
        Player.findOne({ uid: playerid }, (error, data) => {
            handle(res, error, data)
        });
    }
    else if (req.params.id.includes(".")){
        const playerid = req.params.id;
        Player.findOne({ uid: playerid }, (error, data) => {
            handle(res, error, data)
        });
    }
    else {
        const playerid = req.params.id;
        Player.findById(playerid, (error, data) => {
            handle(res, error, data)
        });
    }
});

router.route('/players/:id/setBid').post((req, res, next) => {
    const playerid = req.cookies.playerid;
    Player.findOneAndUpdate(
        { uid: playerid },
        { currentBid: req.body.bid },
        { new: true},
        (error, player) => {
          handle(res, error, player);
        }
    );
});

router.route('/trades').get((req, res, next) => {
    const game = req.query.gameid;
    Trade.find({ game: game}, (error, trades) => {
        handle(res, error, error ? {} : trades.map(t => [t.player1, t.player2]));
    });
});

router.route('/trades').post((req, res, next) => {
    const players = [req.cookies.playerid, req.body.with].sort();
    const gameid = players[0].split(".")[0];
    Player.findOne({ uid: req.body.with, currentBid: req.body.ofcount }, (error, data) => {
        if (error) { handle(res, "BidChanged:" + error, {}); return; }

        Trade.create(
            { player1: players[0], player2: players[1], game: gameid },
            (error, trade) => {
                if (error) { handle(res, "PlayerAlreadyTrading:" + error, {}); return; }

                Player.findOneAndUpdate(
                    { uid: players[0] },
                    { activeTrade: trade._id },
                    (error, player) => {
                      if (error) { handle(res, error, player); return; }

                      Player.findOneAndUpdate(
                          { uid: players[1] },
                          { activeTrade: trade._id },
                          (error, player) => {
                            handle(res, error, player);
                          }
                      );
                    }
                );
            }
        )
    });
});

router.route('/trades/:id/sendCards').post((req, res, next) => {
    const players = array.sort([req.cookies.playerid, req.body.to]);
    const setter = players[0] == req.cookies.playerid ? { player1cards: req.body.cards } : { player2cards: req.body.cards };
    Trade.findOneAndUpdate(
        { player1: players[0], player2: players[1] },
        setter,
        { new: true},
        (error, trade) => {
          if (error) { handle(res, error, {}); return; }

          if (trade.player1cards != null && trade.player2cards != null) {
              // TODO: make transactions
              Trade.deleteOne({_id: trade._id}, function(err){
                if (err) { handle(res, error, trade); return; }
                
                adjustPlayerCards(players[0], trade.player1cards, trade.player2cards, (err, player1) => {
                    if (err) { handle(res, err, {}); return; }
                    adjustPlayerCards(players[1], trade.player2cards, trade.player1cards, (err, player2) => {
                        var winner = ""
                        if (player1.cards.every(c => c.split("-")[1] == player1.cards[0].split("-")[1])) winner += ";" + player1.name;
                        if (player2.cards.every(c => c.split("-")[1] == player2.cards[0].split("-")[1])) winner += ";" + player2.name;

                        if (winner != "") {
                            Game.findOneAndUpdate(
                                { _id: trade.game, winner: null },
                                { winner: winner.substring(0) },
                                (err, game) => {} // err means someone else won
                            )
                        }

                        handle(res, err, trade);
                    });
                });
              });
          }
          else handle(res, error, trade);
        }
    );
});

function adjustPlayerCards(playerid, remove, add, next)
{
    const newcards = cards.filter(c => !remove.some(rc => c == rc)).concat(add);
    Player.findOneAndUpdate(
        { uid: playerid },
        { cards: newcards, activeTrade: null },
        { new: true},
        (error, player) => {
            next(error, player);
        }
    );
}

module.exports = router