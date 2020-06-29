var express = require('express');
var router = express.Router();
var axios = require('axios');

/* GET game page. */
router.get('/:id', async (req, res, next) => {
  const response = await axios.get('http://' + req.headers.host + '/api/games/' + req.params.id);
  res.render('game', { game: response.data });
});

router.get('/:id/board', async (req, res, next) => {
  const gameresponse = await axios.get('http://' + req.headers.host + '/api/games/' + req.params.id);
  const game = gameresponse.data;
  const playerid = req.cookies.playerid;
  const players = await Promise.all(game.players.map(async (pid) => {
    const playerresponse = await axios.get('http://' + req.headers.host + '/api/players/' + pid);
    return playerresponse.data;
  }));

  console.log(">>>" + JSON.stringify(players));
  const me = players.find(p => p.uid == playerid); if (me) me.isMe = true;
  players.forEach(p => p.cards = p.cards.map(c => { return { text: c, img: "/images/" + (!p.isMe ? "unknown" : c.split("-")[1]) + ".png" }; }));

  var all = players.sort((p1, p2) => p1.createdAt < p2.createdAt ? -1 : 1);
  all = all.filter(p => p.createdAt >= (me ? me.createdAt : "-1")).concat(all.filter(p => p.createdAt < (me ? me.createdAt : "-1")));
  const table = { isTable: true, gamestatus: game.status, canStart: players.length == game.playerCount && game.status == "NotStarted" };

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

  res.render('board', { game: game, board: boardConfigs[game.playerCount - 1], players: all });
});

module.exports = router;
