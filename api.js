const app = express()
const router = app.Router()

let Helper = require('./helper')
let Game = require('./models/game')
let Player = require('./models/player')
let Trade = require('./models/trade')

function handle(res, err, data)
{
    if (err)
        res.status(500).json({ message: err});
    else
        res.status(200).json(data);
}

router.route('/game/:id').get((req, res, next) => {
    Game.findById(req.params.id, (error, data) => {
        handle(res, error, data);
    });
});

router.route('/game').post((req, res, next) => {
    Game.create({ gameid: id, state: req.body}, (error, data) => {
        handle(res, error, data);
    });
});

router.route('/game/:id/join').post((req, res, next) => {
    Player.findOneAndUpdate(
        { uid: req.params.id + '.' + req.body.name },
        {
            uid: req.params.id + '.' + req.body.name,
            name: req.body.name,
            currentBid: 0,
            tradindCardsCount: 0
        },
        { upsert: true, new: true },
        (err, player) => {
            if (err) handle(res, err, player);
            else {
                Game.updateOne(
                    {_id: req.params.id},
                    { $push: { players: player } },
                    (error, data) => handle(res, error, player));
            }
        }
    );
});

const deckConfig = ["1-basilisk","1-centaurus","1-chimera","1-hippogriff","1-manticore","1-medusa","1-pegasus","1-phoenix","1-basilisk","2-centaurus","2-chimera","2-hippogriff","2-manticore","2-medusa","2-pegasus","2-phoenix","3-basilisk","3-centaurus","3-chimera","3-hippogriff","3-manticore","3-medusa","3-pegasus","3-phoenix","4-basilisk","4-centaurus","4-chimera","4-hippogriff","4-manticore","4-medusa","4-pegasus","4-phoenix","5-basilisk","5-centaurus","5-chimera","5-hippogriff","5-manticore","5-medusa","5-pegasus","5-phoenix","6-basilisk","6-centaurus","6-chimera","6-hippogriff","6-manticore","6-medusa","6-pegasus","6-phoenix","7-basilisk","7-centaurus","7-chimera","7-hippogriff","7-manticore","7-medusa","7-pegasus","7-phoenix","8-basilisk","8-centaurus","8-chimera","8-hippogriff","8-manticore","8-medusa","8-pegasus","8-phoenix","9-basilisk","9-centaurus","9-chimera","9-hippogriff","9-manticore","9-medusa","9-pegasus","9-phoenix"];

router.route('/game/:id/start').post((req, res, next) => {
    Game.findByIdAndUpdate(
      req.params.id,
      { status: "Started" },
      { new: true},
      (error, game) => {
        if (err) { handle(res, error, game); return; }

        var deck = deckConfig.slice(0); Helper.shuffle(deck);
        var handSize = randomDeck.length / playerCount;
        var playerid = 0;
        game.players.forEach(pid => {
            await Player.findByIdAndUpdate(
                pid,
                { cards: deck.slice(playerid * handSize, playerid * handSize + handSize) },
                (error, game) => {
                    if (err) handle(res, error, game); // THIS WOULD SUCK
                }
            );
            playerid++;
        });

        handle(res, null, {});
    });
});

router.route('/players/:id').get((req, res, next) => {
    const playerid = req.cookies.playerid;
    Player.findById(playerid, (error, data) => {
        handle(res, error, data)
    });
});

router.route('/players/:id/setBid').post((req, res, next) => {
    const playerid = req.cookies.playerid;
    Player.findOneAndUpdate(
        { uid: playerId },
        { currentBid: req.body.bid },
        { new: true},
        (error, player) => {
          handle(res, error, player);
        }
    );
});

router.route('/trades').post((req, res, next) => {
    const players = array.sort([req.cookies.playerid, req.body.with]);
    
    Trade.create(
        { player1: players[0], bidAccepter: players[1] },
        (error, trade) => handle(res, error, trade)
    )
});

router.route('/trades/:id/sendCards').post((req, res, next) => {
    const players = array.sort([req.cookies.playerid, req.body.to]);
    const setter = players[0] == req.cookies.playerid ? { player1cards: req.body.cards } : { player2cards: req.body.cards };
    Trade.findOneAndUpdate(
        { player1: players[0], player2: players[1] },
        setter,
        { new: true},
        (error, player) => {
          if (error) handle(res, error, trade);

          if (trade.player1cards != null && trade.player2cards != null) {
              Trade.
          }
          else handle(res, error, trade);
        }
    );
});

function adjustPlayerCards(player, remove, add, next)
{
    const newcards = cards.filter(c => !remove.some(rc => c == rc)).concat(req.cards);
    Player.findOneAndUpdate(
        { _id: player._id, updatedAt: player.updatedAt },
        { cards = newcards, activeTrade: null },
        { new: true},
        (error, player) => {
            handle(res, error, player);
        }
    );
}

module.exports = router