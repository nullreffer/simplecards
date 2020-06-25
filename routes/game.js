var express = require('express');
var router = express.Router();

/* GET game page. */
router.get('/:id', function(req, res, next) {
  const game = await axios.get('http://' + req.hostname + '/api/game/' + req.params.id);
  res.render('game', game);
});

router.get('/:id/board', function(req, res, next) {
  const game = await axios.get('http://' + req.hostname + '/api/game/' + req.params.id);
  const playerid = req.cookies.playerid;
  const players = game.players.map(pid => {
    return await axios.get('http://' + req.hostname + '/api/players/' + pid);
  });

  players.forEach(p => p.isMe = p._id == playerid);
  players.forEach(p => p.cards = p.cards.map(c => { return { text: c, img: "/images/" + (p.isMe ? "unknown" : c.split("-")[1]) + ".png" }; }));

  const activeTrades = players.map(p => {
    if (p.activeTrade == null) return null;
    const trader = players.find(p2 => p.activeTrade == p2.activeTrade);
    if (!trader) return null;
    return trader.name + " <=> " + p.name;
  }).filter(t => t != null);

  const all = players.sort(p => p._id >= playerid ? "A" + p.createdAt : "Z" + p.createdAt); // me == all[0]
  const table = { isTable: true, gameStatus: game.status, trades: activeTrades };

  const boardConfigs = [
    [ [null, null, null], [null, table, null], [null, all[0], null] ], // 1 player
    [ [null, all[1], null], [null, table, null], [null, all[0], null] ], // 2 player
    [ [all[1], null, all[2]], [null, table, null], [null, all[0], null] ], // 3 player
    [ [null, all[2], null], [all[1], table, all[3]], [null, all[0], null] ], // 4 player
    [ [all[2], null, all[3]], [all[1], table, all[4]], [null, all[0], null] ], // 5 player
    [ [all[2], all[3], all[4]], [all[1], table, all[5]], [null, all[0], null] ], // 6 player
    [ [all[2], all[3], all[4]], [all[1], table, all[5]], [all[0], null, all[6]] ], // 7 player
    [ [all[3], all[4], all[5]], [all[2], table, all[6]], [all[1], all[0], all[7]] ] // 8 player
  ];

  res.render('board', { board: boardConfigs[game.playerCount - 1], players: all });
});

module.exports = router;
