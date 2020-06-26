var express = require('express');
var router = express.Router();
var axios = require('axios');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { joingameid: req.query.joingameid });
});

router.route('/newgame').post(async (req, res, next) => {
  console.log(">>>" + req.headers.host);
  
  try {
    const response = await axios.post('http://' + req.headers.host + '/api/games', {
      name: req.body.name.replace(/\W/g, ''),
      playerCount: req.body.playerCount
    });

    const created = response.data;
    console.log(response.data);
    res.redirect('/?joingameid=' + created._id);
  } catch (err) { console.log(err.data); res.redirect("/"); }
});

router.route('/joingame').post(async (req, res, next) => {
  const joingameid = req.body.joingameid;
  try {
    const response = await axios.post('http://' + req.headers.host + '/api/games/' + joingameid + '/join', {
      name: req.body.name
    });

    const player = response.data;
    res.cookie('playerid', player.uid);
    res.redirect('/game/' + joingameid);
  } catch (err) { console.log(err.data); res.redirect("/"); }
});

module.exports = router;
