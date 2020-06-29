var express = require('express');
var router = express.Router();
var axios = require('axios');

const names = ["gloriousberserkers","hairlessliches","dwarfchangelings","greensprites","harlequinwispmother","waterjackalopes","brassvalkyries","nightogres","darkvampires","scarlethags","lionsouls","blazingslimes","granitespriggans","snowanomalies","mammothscourge","trackerspectres","restlessleprechauns","scorpionmummies","huntinghippogriffs","westernsirens","summerrocs","hiddenskeletons","camouflagedbehemoths","darkcentaurs","brasscentaurs","overlordminotaurs","haunteddemons","armoredcyclopes","woodchangelings","deafskeletons","emeraldbehemoths","venomousatranochs","hairlesswendigos","goldencorruptions","goldenvampires","goldwyrms","diresuccubi","irongargoyles","amazonanubis","fakesouleaters","pinkwraiths","caverngorgons","terracottafauns","lurkingreapers","serpentshades","pinkwendigos","arcticmummies","pixypisces","revivedspriggans","glowchimeras"];

/* GET home page. */
router.get('/', async (req, res, next) => {
  var randomname = names[Math.floor(Math.random() * names.length)];
  if (req.cookies.playerid) randomname = req.cookies.playerid.split(".")[1];
  const response = await axios.get('http://' + req.headers.host + '/api/games');
  res.render('index', { joingameid: req.query.joingameid, randomname: randomname, isAdmin: req.query.godmode, games: response.data });
});

router.route('/newgame').post(async (req, res, next) => {
  try {
    const response = await axios.post('http://' + req.headers.host + '/api/games', {
      name: req.body.name.replace(/\W/g, ''),
      playerCount: req.body.playerCount
    });

    const created = response.data;
    console.log(response.data);
    res.redirect('/?joingameid=' + created.name);
  } catch (err) { console.log(err.data); res.redirect("/"); }
});

router.route('/joingame').post(async (req, res, next) => {
  const joingameid = req.body.joingameid;
  const playername = req.body.name ? req.body.name : req.cookies.playerid.split(".")[1];

  try {
    const response = await axios.post('http://' + req.headers.host + '/api/games/' + joingameid + '/join', {
      name: playername
    });

    const player = response.data;
    res.cookie('playerid', player.uid);
    res.redirect('/game/' + joingameid);
  } catch (err) { res.redirect("/?err=" + err.response.data.message); }
});

module.exports = router;
