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
    if (err || data == null) {
        console.log(err ? err : "Data is null");
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
        (error, player) => {
            if (error || player == null) handle(res, error, {});
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
        if (error || game == null) { handle(res, error, {}); return; }

        const handSize = 9;
        const deck = createDeck(game.playerCount, handSize);
        try {
            await Promise.all(game.players.map(async (pid, playerix) => {
                const player = await Player.findByIdAndUpdate(
                    pid,
                    { cards: deck.slice(playerix * handSize, playerix * handSize + handSize) }
                );                
                return player;
            }));

            handle(res, null, {});
        } catch (error) {
            handle(res, error, {});
        }
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
        handle(res, error, error ? {} : trades);
    });
});

router.route('/trades/:id').get((req, res, next) => {
    Trade.findById(req.params.id, (error, trade) => {
        handle(res, error, error ? {} : trade);
    });
});

router.route('/trades').post((req, res, next) => {
    const players = [req.cookies.playerid, req.body.with].sort();
    const gameid = players[0].split(".")[0];
    
    Player.findOne({ uid: req.body.with, currentBid: req.body.ofcount }, (error, data) => {
        if (error || data == null) { handle(res, "BidChanged:" + error + ":" +data, {}); return; }

        Trade.create(
            { player1: players[0], player2: players[1], game: gameid, ofcount: req.body.ofcount },
            (error, trade) => {
                if (error || trade == null) { handle(res, "PlayerAlreadyTrading:" + error, {}); return; }

                Player.findOneAndUpdate(
                    { uid: players[0] },
                    { activeTrade: trade._id },
                    (error, player) => {
                      if (error || player == null) { handle(res, error, player); return; }

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
    const players = [req.cookies.playerid, req.body.to].sort();
    console.log("WWW" + JSON.stringify(req.body));
    const setter = players[0] == req.cookies.playerid ? { player1cards: req.body.cards } : { player2cards: req.body.cards };
    Trade.findOneAndUpdate(
        { player1: players[0], player2: players[1] },
        setter,
        { new: true},
        (error, trade) => {
          if (error || trade == null) { handle(res, error, {}); return; }

          if (trade.player1cards != null && trade.player2cards != null
            && trade.player1cards.length == trade.ofcount
            && trade.player2cards.length == trade.ofcount) {
              // TODO: make transactions
              Trade.deleteOne({_id: trade._id}, function(error){
                if (error) { handle(res, error, trade); return; }
                
                adjustPlayerCards(players[0], trade.player1cards, trade.player2cards, (error, player1) => {
                    if (error || player1 == null) { handle(res, error, {}); return; }
                    adjustPlayerCards(players[1], trade.player2cards, trade.player1cards, (error, player2) => {
                        if (error || player2 == null) { handle(res, error, {}); return; }

                        var winner = "";
                        if (player1.cards.every(c => c.split("-")[1] == player1.cards[0].split("-")[1])) winner += ";" + player1.name;
                        if (player2.cards.every(c => c.split("-")[1] == player2.cards[0].split("-")[1])) winner += ";" + player2.name;

                        if (winner != "") {
                            Game.findOneAndUpdate(
                                { _id: trade.game, winner: null },
                                { status: "Ended", winner: winner.substring(1) },
                                (err, game) => {} // err means someone else won
                            )
                        }

                        handle(res, error, trade);
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
    Player.findOne(
        { uid: playerid },
        (error, player) => {
            if (error || player == null) { next(error, player); return; }

            const newcards = player.cards.filter(c => !remove.some(rc => c == rc)).concat(add);
            Player.findOneAndUpdate(
                { uid: playerid },
                { cards: newcards, activeTrade: null },
                { new: true},
                (error, player) => {
                    next(error, player);
                }
            );
        }
    );
}

module.exports = router