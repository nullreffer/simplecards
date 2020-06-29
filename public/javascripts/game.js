function startGame()
{
    const gameid = $("#gameid").val();
    $.post("/api/games/" + gameid + "/start", {})
     .done(() => {  })
     .fail(() => showalert("It's all coming crashing down."))
     .always(() => { });
}

function replayGame(btn)
{
    $(btn).hide();
    const gameid = $("#gameid").val();
    $.post("/joingame", { joingameid: gameid })
     .done(() => { location.reload(true); })
     .fail(() => showalert("It's all coming crashing down."))
     .always(() => { });
}

function setBid() {
    if ($("#mytrade").val() != "" && $("#mytrade").val() != null)
    {
        showalert("Hold your spaceships, finish what you started first.");
        return;
    }

    if ($("#bidCount").is(":disabled"))
    {
        $.post("/api/players/me/setBid", {bid: 0})
        .done(() => { $("#bidCount").val(0); $("#bidCount").prop("disabled", false); $("#setBid").html("Set"); })
        .fail(() => showalert("a WTF moment happened"))
        .always(() => { });
        return;
    }

    const bidVal = $("#bidCount").val();
    $.post("/api/players/me/setBid", {bid: bidVal})
     .done(() => { $("#bidCount").prop("disabled", true); $("#setBid").html("Reset"); })
     .fail(() => showalert("a WTF moment happened"))
     .always(() => { });
}

function selectCard(li)
{
    if ($(li).hasClass("selected")) {
        $(li).removeClass("selected");
    } else {
        $(li).addClass("selected");
    }
}

function acceptBid(playerid, bidButton) {
    // disable all other bid buttons
    $(bidButton).prop("disabled", true);
    const databid = $(bidButton).html();
    const mybid = $("#bidCount").val();

    if (databid != mybid) {
        showalert("So you want to give " + mybid + " but you want to take " + databid + "? No, thank you.");
        return;
    }

    const me = $(".me").attr("data-id");
    $.get("/api/trades?gameid=" + $("#gameid").val())
     .done((trades) => { 
        if (trades.some(t => t.player1 == me || t.player2 == me)) {
            showalert("You've got something else going on at the moment.");
            return;
        }

        $.post("/api/trades", {with: playerid, ofcount: databid})
        .done((trade) => { 
            $("#mytrade").val(trade._id);
        })
        .fail(() => {
            showalert("Oops, failed to bid, someone else was probably faster, or the player changed the bid.");
        })
        .always(() => { });
     })
     .fail(() => {
         showalert("Did you check all the valves.");
     })
     .always(() => { });
}

function sendCards() {
    const scards = $("div.me li.selected").toArray().map((c) => $(c).attr("data-id"));
    $.get("/api/trades/" + $("#mytrade").val())
    .done((trade) => {
        if (trade.ofcount != scards.length) {
            showalert("Uh oh, you selected a few cards too " + (scards.length > trade.ofcount ? "many." : "less." ));
            return;
        }

        const allcards = $("div.me li.card").toArray().map((c) => $(c).attr("data-id"));
        if (allcards.length != 9)
        {
            showalert("You'll go broke if you keep doing that." );
            return;
        }

        const me = $(".me").attr("data-id");
        const playerto = trade.player1 == me ? trade.player2 : trade.player1;
        $.post("/api/trades/" + $("#mytrade").val() + "/sendCards", { cards: scards, to: playerto })
        .done(() => { showmessage(trade.ofcount + " cards sent to " + playerto.split(".")[1] + "!!!") })
        .fail(() => showalert("Have you tried hitting the button harder?"))
        .always(() => { });
    }).fail(() => showalert("Yea... maybe try that again?"))
    .always(() => { });   
}

function showmessage(message)
{
    $("#messages").prepend("<p class='message'>" + message + "</p>");
}

function showalert(message)
{
    $("#messages").prepend("<p class='alert'>" + message + "</p>");
}

function onGameRunning(next)
{
    // refresh me: cards, hide buttons if needed, 
    var meTrading = false;
    const cards = $("div.me li.card");
    const getme = $.get("/api/players/me")
    .done((me) => {
        $("#sendCards").prop("disabled", me.activeTrade ? false : true);
        // $("#bidCount").val(me.currentBid);
        $("#mytrade").val(me.activeTrade)
        if (me.activeTrade) { $(".bidButton").prop("disabled", true ); meTrading = true; }
        if (me.activeTrade) $("#setBid").prop("disabled", true );
        else $("#setBid").prop("disabled", false );
        // remove old cards
        cards.each(cid => {
            const c = cards[cid];
            const cardid = $(c).attr("data-id");
            if (!me.cards.some(x => x == cardid)) {
                $(c).slideDown(100, () => { $(c).remove(); });
            }
        });

        // add new cards
        me.cards.forEach(cid => {
            if (!cards.toArray().some(ci => $(ci).attr("data-id") == cid)) {
                const c = { text: cid, img: "/images/" + cid.split("-")[1] + ".png" }
                $nc = $("<li class='card' data-id='" + c.text + "' onclick='selectCard(this)' ><span>" + c.text + "</span><img src='" + c.img + "' /></li>");
                $("div.me .cardlist").append($nc);
                $nc.show();
            }
        });
    }).fail(() => showalert("Are you sure you're well and alive?"))
    .always(() => { });

    // refresh others: bid
    const getothers = [];
    $(".someone").each(function() {
        const someone = $(this);
        const pid = $(this).attr("data-id");
        const getother = $.get("/api/players/" + pid)
        .done((player) => {
            $(someone).find(".bidButton").attr("data-trade", player.activeTrade);
            $(someone).find(".bidButton").html(player.currentBid);
        }).fail(() => showalert("I think player " + pid.split(".")[1] + " is sleeping."))
        .always(() => { });
        getothers.push(getother);
    });

    // refresh game and winner
    const getgame = $.get("/api/games/" + $("#gameid").val())
     .done((game) => {
        $("#gamestatus").val(game.status);
        $("#gamestatusmessage").html("Game status: " + game.status);
        $("#gamewinner").html(game.winner);
     })
     .fail(() => {
         showalert("Okay, so this is awkward, but I think I screwed up.");
     })
     .always(() => { });

     // refresh trades
     const gettrades = $.get("/api/trades?gameid=" + $("#gameid").val())
     .done((trades) => {
        if (trades.length == 0) $("#activetrades").html("No active trades");
        else $("#activetrades").html("").append(trades.map(t => t.player1.split(".")[1] + " <=> " + t.player2.split(".")[1] + " // " + t.ofcount).join("<br/>"));
     })
     .fail(() => {
        showalert("It's quiet in here.");
     })
     .always(() => { });

     $.when(getme, ...getothers, getgame, gettrades)
     .done((me, others, game, trades) => { 
        if (meTrading) $(".bidButton").prop("disabled", true);
        $(".bidButton").each((ix, bidButton) => {
            if ($(bidButton).attr("data-trade")) $(bidButton).prop("disabled", true);
            else if ($(bidButton).html() == "0") $(bidButton).prop("disabled", true);
            else if (!$("#bidCount").is(":disabled")) $(bidButton).prop("disabled", true);
            else if ($(bidButton).html() != $("#bidCount").val()) $(bidButton).prop("disabled", true);
            else if ($("#gamestatus").val() != "Running")  $(bidButton).prop("disabled", true);
            else $(bidButton).prop("disabled", false);
        });
        next();
    });
}

var initialRefresh = true;
function backgroundBoardRefresher() {
// refreshBoard(() => {}); return;

    if ($("#gamestatus").val() == "NotStarted") {
        $("#gamestatusmessage").html("Not Started");
        refreshBoard(() => { setTimeout(backgroundBoardRefresher, 1000); });
    }
    else if ($("#gamestatus").val() == "Running") {
        $("#gamestatusmessage").html("Game status: Running");
        if (initialRefresh)
        {
            initialRefresh = false;
            refreshBoard(() => { setTimeout(backgroundBoardRefresher, 1000); });
        }
        else {
            onGameRunning(() => { setTimeout(backgroundBoardRefresher, 1000); });
        }
    }
    else if ($("#gamestatus").val() == "Ended") {
        refreshBoard(() => {
            $("#gamestatusmessage").html("Ended. " + $("#gamewinner").val() + " won.")
            $("#messages").hide();
            $("#activetrades").hide();
            $(".bidButton").prop("disabled", true);
            $("#setbid").prop("disabled", true);
            $("#sendCards").prop("disabled", true);

            $("#boardcenter").append("<button onclick='replayGame(this)' >Play again</buttton>");
        });
    }
    else {
        refreshBoard(() => { setTimeout(backgroundBoardRefresher, 1000); });
    }
}

function refreshBoard(next) {
    $("#board").load("/game/" + $("#gameid").val() + "/board", function( response, status, xhr ) {
        next();
    });
}

$(document).ready(function() {
    $.ajaxSetup({ traditional: true, cache: false });
    backgroundBoardRefresher();
});