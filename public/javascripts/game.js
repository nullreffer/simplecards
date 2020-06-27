function startGame()
{
    const gameid = $("#gameid").val();
    $.post("/api/games/" + gameid + "/start", {})
     .done(() => {  })
     .fail(() => showalert("It's all coming crashing down."))
     .always(() => { });
}

function setBid() {
    const bidVal = $("#bidCount").val();
    $.post("/api/players/me/setBid", {bid: bidVal})
     .done(() => {  })
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

function acceptBid(playerid, ofcount) {
    // disable all other bid buttons
    $(".bidButton").prop("disabled", true);

    $.post("/api/trades", {with: playerid, ofcount: ofcount})
     .done(() => {  })
     .fail(() => {
         showalert("Oops, failed to bid, someone else was probably faster, or the player changed the bid.");
     })
     .always(() => { });
}

function sendCards() {
    const cards = $("div.me li.selected .cardid").map(() => $.trim($(this).text()));
    $.get("/api/players/me")
    .done((me) => {
        if (me.currentBid != cards.length) {
            showalert("Oh oh, you selected a few cards too " + (cards.length > me.currentBid ? "many." : "less." ));
            return;
        }

        $.post("/api/trades/" + me.activeTrade + "/sendCards", {cards: cards})
        .done(() => { })
        .fail(() => showalert("Have you tried hitting the button harder?"))
        .always(() => { });
    }).fail(() => showalert("Yea... maybe try that again?"))
    .always(() => { });   
}

function showalert(message)
{
    // alert(message);
    $("#messages").prepend("<p>" + message + "</p>");
}

function onGameRunning(next)
{
    // refresh me: cards, hide buttons if needed, 
    const cards = $("div.me li.card");
    const getme = $.get("/api/players/me")
    .done((me) => {
        $("#setbid").prop("disabled", me.activeTrade ? true : false);
        $("#sendCards").prop("disabled", me.activeTrade ? false : true);
        
        if (me.activeTrade) { $(".bidButton").prop("disabled", true ); }

        // remove old cards
        cards.each(c => {
            if (!me.cards.some(x => x == $(c).attr("data-id"))) $(c).slideDown(100, () => { $(c).remove(); });
        });

        // add new cards
        me.cards.forEach(c => {
            $nc = $("<li class='card' data-id='" + c.text + "' onclick='selectCard(this)' ><span>" + c.text + "</span><img url='" + c.img + "' /></li>");
            $("div.me .cardlist").append($nc);
            $nc.show();
        });
    }).fail(() => showalert("Are you sure you're well and alive?"))
    .always(() => { });

    // refresh others: bid
    const getothers = $(".someone").each(function() {
        const someone = $(this);
        const pid = $(this).attr("data-id");
        const gamestatus = $("#gamestatus").val();
        $.get("/api/players/" + pid)
        .done((player) => {
            $(someone).find(".bidButton").prop("disabled", player.currentBid == 0 || player.activeTrade || gamestatus != "Running" ? true : false);
            $(someone).find(".bidButton").val(player.currentBid);
        }).fail(() => showalert("I think player " + pid.split(".")[1] + " is sleeping."))
        .always(() => { });
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
        $("#activetrades").html("").append(trades.map(t => t[0] + " <=> " + t[1]).join("<br/>"));
     })
     .fail(() => {
        showalert("It's quiet in here.");
     })
     .always(() => { });

     $.when(getme, getothers, getgame, gettrades)
     .done((me, others, game, trades) => { next() });
}

function backgroundBoardRefresher() {
// refreshBoard(() => {}); return;

    if ($("#gamestatus").val() == "NotStarted") {
        $("#gamestatusmessage").html("Not Started");
        refreshBoard(() => { setTimeout(backgroundBoardRefresher, 5000); });
    }
    else if ($("#gamestatus").val() != "Ended") {
        $("#gamestatusmessage").html("Game status: Running");
        refreshBoard(() => onGameRunning(() => { setTimeout(backgroundBoardRefresher, 5000); }));
    }
    else {
        refreshBoard(() => {
            $("#gamestatusmessage").html("Ended. " + $("#gamewinner").val() + " won.")
            $(".bidButton").prop("disabled", true);
            $("#setbid").prop("disabled", true);
            $("#sendCards").prop("disabled", true);
        });
    }
}

function refreshBoard(next) {
    $("#board").load("/game/" + $("#gameid").val() + "/board", function( response, status, xhr ) {
        next();
    });
}

$(document).ready(function() {
    backgroundBoardRefresher();
});