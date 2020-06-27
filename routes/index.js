var express = require('express');
var router = express.Router();
var axios = require('axios');

const names = ["gloriousberserkers","hairlessliches","dwarfchangelings","greensprites","harlequinwispmother","waterjackalopes","brassvalkyries","nightogres","darkvampires","scarlethags","lionsouls","blazingslimes","granitespriggans","snowanomalies","mammothscourge","trackerspectres","restlessleprechauns","scorpionmummies","huntinghippogriffs","westernsirens","summerrocs","hiddenskeletons","camouflagedbehemoths","darkcentaurs","brasscentaurs","overlordminotaurs","haunteddemons","armoredcyclopes","woodchangelings","deafskeletons","emeraldbehemoths","venomousatranochs","hairlesswendigos","goldencorruptions","goldenvampires","goldwyrms","diresuccubi","irongargoyles","amazonanubis","fakesouleaters","pinkwraiths","caverngorgons","terracottafauns","lurkingreapers","serpentshades","pinkwendigos","arcticmummies","pixypisces","revivedspriggans","glowchimeras"];

/* GET home page. */
router.get('/', (req, res, next) => {
  var randomname = names[Math.floor(Math.random() * names.length)];
  if (req.cookies.playerid) randomname = req.cookies.playerid;
  res.render('index', { joingameid: req.query.joingameid, randomname: randomname });
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
