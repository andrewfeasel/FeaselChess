$("#alertMessage").text(`White's Move`);
const Board = {
  degrees: '0deg',
  canFlip: false,
  currentPlayer: "White",
  turnCount: 0,
  updateDegrees(){
    $('#game').css('rotate', this.degrees);
    $('#game td').css('rotate', this.degrees);
  },
  flip() {
    if(this.canFlip) {
      switch(this.degrees){
        case '0deg':
          this.degrees = '180deg'
          this.updateDegrees();
          break;
        case '180deg':
          this.degrees = '0deg';
          this.updateDegrees();
          break;
      }
    }
  },
  changePlayers() {
    if(this.currentPlayer === "White") {
      this.currentPlayer = "Black";
    } else {
      this.currentPlayer = "White";
    }
  }
};
$(".grid td").draggable({
  helper: function () {
    let helper = $("<i>").insertAfter(".grid");
    helper.attr("class", $(this).attr("class"));
    return helper;
  },
  revert: true,
  containment: ".grid",
  start: function () {
    let pos = getGridPosition(this);
    let piece = getPieceAtPosition(pos.column,pos.row);
    let validMoves = getValidMovesForPiece(grid2Obj(), piece, pos);
    $(this).draggable("option", "revert", true);
    $(this).css("border-color", "yellow");
    for (let i in validMoves) {
      getSquare(validMoves[i].column, validMoves[i].row)
      .droppable( "enable" )
      .attr("special", validMoves[i].special);
    }
  },
  stop: function () {
    $(this).css("border-color", "");
    $(".grid td").droppable( "disable" ).removeAttr("special");
  },
  disabled: true
});
    
$(".grid .piece." + Board.currentPlayer).draggable( "enable" );
$(".grid td").droppable({
  drop: function (event, ui) {
    let newPosition = getGridPosition(this);
    let oldPosition = getGridPosition(ui.draggable[0]);
    let annotation = calculateAnnotation(newPosition, oldPosition);
    $(".grid td").removeClass("potentialEnPassant");
    if ($(this).attr("special")) {
      switch ($(this).attr("special")) {
        case "castle":
          let currentRookSquare,newRookSquare;
          if (oldPosition.column - newPosition.column === 2) {
            currentRookSquare = getSquare(1,oldPosition.row);
            newRookSquare = getSquare(oldPosition.column-1,oldPosition.row);
            annotation.castled = 'O-O-O';
          } else {
            currentRookSquare = getSquare(8,oldPosition.row);
            newRookSquare = getSquare(oldPosition.column+1,oldPosition.row);
            annotation.castled = 'O-O';
          }
          newRookSquare.attr("class", currentRookSquare.attr("class"));
          currentRookSquare.attr("class", "");
          break;
        case "twoSquareFirst":
          let newRow = newPosition.row + ((oldPosition.row - newPosition.row)/2);
          getSquare(newPosition.column, newRow).addClass("potentialEnPassant");
          break;
        case "enPassant":
          let capturedPawn = getSquare(newPosition.column, oldPosition.row);
          capturedPawn.attr("class", "");
          annotation.prefix = String.fromCharCode(("a".codePointAt() + (oldPosition.column-1)));
          annotation.row--;
          annotation.captured = true;
          break;
        case "promotion":
          ui.draggable.css("background-position", "");
          ui.draggable.removeClass("pawn");
          let promotionPrompt = prompt('Choose a piece. Your options are: queen (default), rook, bishop, or knight').toLowerCase();
          switch (promotionPrompt.toLowerCase()) {
            case 'rook':
              ui.draggable.addClass('rook');
              notationString += 'R';
              break;
            case 'bishop':
              ui.draggable.addClass('bishop');
              notationString += 'B';
              break;
            case 'knight':
              ui.draggable.addClass('knight');
              notationString += 'K';
              break;
            default:
              ui.draggable.addClass('queen');
              notationString += 'Q';
          };
          break;
      }
    }
    $(this).attr("class", ui.draggable.attr("class"));
    if (!$(this).hasClass("hasMoved")) {
      $(this).addClass("hasMoved");
    }
    $(this).css("border-color", "");
    $(this).draggable( "enable" );
    ui.draggable.attr("class", "");
    ui.draggable.draggable("option", "revert", false);            
    $(".grid .piece." + Board.currentPlayer).draggable( "disable" );
    Board.changePlayers();
    Board.flip();
    if (!getAllValidMovesForSide(Board.currentPlayer).length) {
      if (isKingInCheck(Board.currentPlayer, grid2Obj())) {
        $('#alertMessage').text(`Checkmate! ${Board.currentPlayer} Loses!`);
      } else {
        $('#alertMessage').text('Stalemate!');
      }
    } else {
      if (isKingInCheck(Board.currentPlayer, grid2Obj())) {
        $('#alertMessage').text(`Check! ${Board.currentPlayer}'s Move`);
      } else {
        $('#alertMessage').text(`${Board.currentPlayer}'s Move`);
      }
    }
    $(".grid .piece." + Board.currentPlayer).draggable( "enable" );
    showMoveAnnotation(annotation);
    },
    over: function () {
      $(this).css("border-color", "red");
    },
    out: function () {
      $(this).css("border-color", "");
    },
    disabled: true
});
$('#newGame').click(function(){
  location.reload();
});
$('#toggleFlips').on('click', function(){
  Board.canFlip = !Board.canFlip;
  if(Board.canFlip){
    $(this).text('Board Flips: Enabled');
  } else {
    $(this).text('Board Flips: Disabled');
  }
});
$('#copyButton').on('click', function(){
  navigator.clipboard.writeText($('#textnotation').text());
});