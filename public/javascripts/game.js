function acceptBid(playerid) {
    // disable all other bid buttons
    $(".bidButton").attr("disabled", true);

    $.post("/api/trades", {with: playerid})
     .done(() => {  })
     .fail(() => showalert("Oops, failed to bid, someone else was probably faster."))
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

function sendCards() {
    const cards = $("li.selected .cardid").map(() => $.trim($(this).text()));
    $.get("/api/players/me")
    .done((me) => {
        if (me.tradingCardsCount != cards.length) {
            showalert("Oh oh, you selected a few cards too " + (cards.length > me.currentBid ? "many." : "less." ));
            return;
        }

        $.post("/api/trades/" + me.activeTrade + "/sendCards", {cards: cards})
        .done(() => {  })
        .fail(() => showalert("Have you tried hitting the button harder?"))
        .always(() => { });
    }).fail(() => showalert("Yea... maybe try that again?"));
    
}

function showalert(message)
{
    alert(message);
}

function backgroundBoardRefresher() {
    if ($("#gameStatus").val() == "NotStarted")
    {
        refreshBoard();
        setTimeout(backgroundBoardRefresher, 1000);
    }
}

function refreshBoard() {
    $("#board").load("/game/" + $("#gameid").val() + "/board", function( response, status, xhr ) {
        console.log("Game re-loaded");
    });
}

$(document).load(function() {
    backgroundBoardRefresher();
});