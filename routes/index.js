var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { joingameid: req.query.joingameid });
});

router.route('/newgame').post((req, res, next) => {
  const created = await axios.post('http://' + req.hostname + '/api/game', {
    name: req.body.name,
    playerCount: req.body.playerCount
  });

  res.redirect('/?joingameid=' + created._id);
});

router.route('/joingame').post((req, res, next) => {
  const joingameid = req.query.joingameid;
  const player = await axios.post('http://' + req.hostname + '/api/game/' + joingameid + '/join', {
    name: req.body.name
  });

  res.cookie('playerid', player.uid);
  res.redirect('/game/' + joingameid);
});

module.exports = router;
