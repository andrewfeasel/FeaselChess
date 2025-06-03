$(function () {
    const Board = {
        canFlip: false,
        flipped: false,
        turnCount: 0,
        flip() {
            if (this.canFlip) {
                const board = document.getElementsByTagName('table')[0];
                let pieceArr = Array.from(board.getElementsByTagName('td'));
                if (!this.flipped) {
                    board.style.rotate = '180deg';
                    pieceArr.forEach(piece => piece.style.rotate = '180deg');
                    this.flipped = true;
                } else {
                    board.style.rotate = '0deg';
                    pieceArr.forEach(piece => piece.style.rotate = '0deg');
                    this.flipped = false;
                }
            }
        }
        getPlayer(){
            this.turnCount % 2 === 0
            ? "White"
            : "Black"
        }
    };
    let alertMessage = document.getElementById("alertMessage");
    alertMessage.innerHTML =`White's Move`;
    let textnotation = document.getElementById('textnotation');
    let notationString = '';
    const getGridPosition = (obj) => {
        const column = $(obj).parent().children().index(obj),
            row = $(obj).parent().parent().children().index(obj.parentNode);
        return { column: column+1, row: row+1 };
    };
    const getSquare = (column, row) => {
        return $(".grid tr:nth-child("+(row)+") td:nth-child("+(column)+")");
    };
    const getPieceAtPosition = (column, row, gridObj) => {
        let obj = {},
            retObj = {hasMoved: false},
            i=0,classes;

        if (typeof(gridObj) === "undefined") {
            obj = getSquare(column, row, gridObj);

            if (obj.attr("class")) {
                classes = obj.attr("class").split(' ');
            }

            if (obj.hasClass("piece")) {
                retObj.side = (obj.hasClass("White") ? "White" : "Black");
                for (i in classes) {
                    if ($.inArray(classes[i], ["rook","knight","bishop","queen","king","pawn"]) != -1)  {
                        retObj.type = classes[i];
                    }
                    if (classes[i] === "hasMoved") {
                        retObj.hasMoved = true;
                    }
                }
            }

            if (obj.hasClass("potentialEnPassant")) {
                retObj.potentialEnPassant = true;
            }
        } else {
            retObj = gridObj[row-1][column-1];
        }
        return retObj;
    };
    const calculateAnnotation = (newPosition, oldPosition) => {
        let grid = grid2Obj();
        let pieceBeingMoved = getPieceAtPosition(oldPosition.column, oldPosition.row, grid);
        let pieceAtNewPosition = getPieceAtPosition(newPosition.column, newPosition.row, grid);
        let annotation = {};
        annotation.column = newPosition.column;
        annotation.row = (9-newPosition.row);
        annotation.captured = typeof pieceAtNewPosition.side !== "undefined";
        switch (pieceBeingMoved.type) {
            case "pawn":
                if(!!annotation.captured){
                    annotation.prefix = String.fromCharCode(("a".codePointAt() + (oldPosition.column-1)));
                }
                else {
                    annotation.prefix = '';
                }
                break;
            case "knight":
                annotation.prefix = "N";
                break;
            case "king":
                annotation.prefix = "K";
                break;
            case "bishop":
                annotation.prefix = "B";
                break;
            case "rook":
                annotation.prefix = "R";
                break;
            case "queen":
                annotation.prefix = "Q";
                break;
        }
        return annotation;
    };
    const grid2Obj = () => {
        let i=1,j=1,
            gridObj = [];
        for (i=1;i<=8;i++) {
            gridObj.push([]);
            for (j=1;j<=8;j++) {
                gridObj[i-1].push(getPieceAtPosition(j,i));
            }
        }
        return gridObj;
    };

    const isKingInCheck = (side,gridObj) => {
        let validMoves = [],
            i,j,k,kingPos={};

        // first, find the king we're interested in...
        for (i=0;i<8;i++) {
            for (j=0;j<8;j++) {
                if (gridObj[i][j].hasOwnProperty("side") &&
                    gridObj[i][j].side === side &&
                    gridObj[i][j].type === "king") {
                    // king found at row i column j
                    kingPos = {row: i+1, column: j+1};
                    break;
                }
            }
            if (kingPos.hasOwnProperty("row")) {
                break;
            }
        }
        // then, see if any of our opponents can validly occupy our king's space
        for (i=0;i<8;i++) {
            for (j=0;j<8;j++) {
                if (gridObj[i][j].hasOwnProperty("side") &&
                    gridObj[i][j].side !== side) {
                    validMoves = getValidMovesForPiece(gridObj, gridObj[i][j], {row: i+1, column: j+1}, true);
                    for (k=0;k<validMoves.length;k++) {
                        if (validMoves[k].column === kingPos.column &&
                            validMoves[k].row === kingPos.row) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    };

    const getValidMovesForPiece = (gridObj, piece, position,ignoreCheck) => {
        var moves = [],validMoves = [],
            i,tempGridObj,
            direction,checkPosition;

        switch (piece.type) {
            case "pawn":
                direction = (piece.side === "White") ? -1 : 1;
                if (!getPieceAtPosition(position.column,position.row + (direction*1),gridObj).hasOwnProperty("side")) {
                    moves.push({column: position.column, row: position.row + (direction*1)});
                }

                if (
                    (
                        (piece.side === "White" && position.row === 7) ||
                        (piece.side === "Black" && position.row === 2)
                    ) &&
                    !getPieceAtPosition(position.column,position.row + (direction*2),gridObj).hasOwnProperty("side") &&
                    !getPieceAtPosition(position.column,position.row + (direction*1),gridObj).hasOwnProperty("side")
                   ) {
                       moves.push({column: position.column, row: position.row + (direction*2), special: "twoSquareFirst" });
                }
                if (position.column > 1) {
                    checkPosition = getPieceAtPosition(position.column-1,position.row + (direction*1),gridObj);
                    if (checkPosition.hasOwnProperty("side") && checkPosition.side !== piece.side) {
                        moves.push({column:position.column-1,row:position.row + (direction*1)});
                    } else if (checkPosition.hasOwnProperty("potentialEnPassant")) {
                        moves.push({column:position.column-1,row:position.row + (direction*1), special: "enPassant"});
                    }
                }
                if (position.column < 8) {
                    checkPosition = getPieceAtPosition(position.column+1,position.row + (direction*1),gridObj);
                    if (checkPosition.hasOwnProperty("side") && checkPosition.side !== piece.side) {
                        moves.push({column:position.column+1,row:position.row + (direction*1)});
                    } else if (checkPosition.hasOwnProperty("potentialEnPassant")) {
                        moves.push({column:position.column+1,row:position.row + (direction*1), special: "enPassant"});
                    }
                }
                for (i=0;i<moves.length;i++) {
                    if (moves[i].row === 8 || moves[i].row === 1) {
                        moves[i].special = "promotion";
                    }
                }

            break;

            case "knight":
                var ones = [-1,1],
                    twos = [-2,2],
                    i,j,k;
                for (i=0;i<twos.length;i++) {
                    for (j=0;j<ones.length;j++) {
                        let pairs = [[twos[i],ones[j]], [ones[i],twos[j]]];
                        for (k=0;k<pairs.length;k++) {
                            if (position.row+pairs[k][0] >= 1 &&
                                position.row+pairs[k][0] <= 8 &&
                                position.column+pairs[k][1] >= 1 &&
                                position.column+pairs[k][1] <= 8) {
                                    checkPosition = getPieceAtPosition(position.column+pairs[k][1], position.row+pairs[k][0],gridObj);
                                    if (checkPosition.side !== piece.side) {
                                        moves.push({row: position.row+pairs[k][0], column: position.column+pairs[k][1]});
                                    }
                            }
                        }
                    }
                }
            break;
            case "bishop":
                var i,j,checkCoords,opts = [[1,1],[1,-1],[-1,1],[-1,-1]];
                for (i=0;i<opts.length;i++) {
                    checkCoords = {
                            row: position.row + opts[i][0],
                            column: position.column + opts[i][1]
                        };
                    while (checkCoords.row <= 8 && checkCoords.row >=1 &&
                           checkCoords.column <= 8 && checkCoords.column >= 1) {
                        checkPosition = getPieceAtPosition(checkCoords.column, checkCoords.row,gridObj);
                        if (checkPosition.side === piece.side) {
                            break;
                        } else if (checkPosition.hasOwnProperty("side")) {
                            moves.push(checkCoords);
                            break;
                        } else {
                            moves.push(checkCoords);
                            checkCoords = {
                                row: checkCoords.row + opts[i][0],
                                column: checkCoords.column + opts[i][1]
                            };
                        }
                    }
                }
            break;
            case "rook":
                var i,j,checkCoords,opts = [[1,0],[0,1],[-1,0],[0,-1]];
                for (i=0;i<opts.length;i++) {
                    checkCoords = {
                            row: position.row + opts[i][0],
                            column: position.column + opts[i][1]
                        };
                    while (checkCoords.row <= 8 && checkCoords.row >=1 &&
                           checkCoords.column <= 8 && checkCoords.column >= 1) {
                        checkPosition = getPieceAtPosition(checkCoords.column, checkCoords.row,gridObj);
                        if (checkPosition.side === piece.side) {
                            break;
                        } else if (checkPosition.hasOwnProperty("side")) {
                            moves.push(checkCoords);
                            break;
                        } else {
                            moves.push(checkCoords);
                            checkCoords = {
                                row: checkCoords.row + opts[i][0],
                                column: checkCoords.column + opts[i][1]
                            };
                        }
                    }
                }
            break;
            case "queen":
                var i,j,checkCoords,opts = [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[0,1],[-1,0],[0,-1]];
                for (i=0;i<opts.length;i++) {
                    checkCoords = {
                            row: position.row + opts[i][0],
                            column: position.column + opts[i][1]
                        };
                    while (checkCoords.row <= 8 && checkCoords.row >=1 &&
                           checkCoords.column <= 8 && checkCoords.column >= 1) {
                        checkPosition = getPieceAtPosition(checkCoords.column, checkCoords.row,gridObj);
                        if (checkPosition.side === piece.side) {
                            break;
                        } else if (checkPosition.hasOwnProperty("side")) {
                            moves.push(checkCoords);
                            break;
                        } else {
                            moves.push(checkCoords);
                            checkCoords = {
                                row: checkCoords.row + opts[i][0],
                                column: checkCoords.column + opts[i][1]
                            };
                        }
                    }
                }
            break;
            case "king":
                var i,j,checkCoords,opts = [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[0,1],[-1,0],[0,-1]];
                for (i=0;i<opts.length;i++) {
                    checkCoords = {
                            row: position.row + opts[i][0],
                            column: position.column + opts[i][1]
                        };

                    if (checkCoords.row <= 8 && checkCoords.row >=1 &&
                        checkCoords.column <= 8 && checkCoords.column >= 1) {
                        checkPosition = getPieceAtPosition(checkCoords.column, checkCoords.row,gridObj);
                        if (checkPosition.side !== piece.side) {
                            moves.push(checkCoords);
                        }
                    }
                }
                // castling
                if (!piece.hasMoved && !ignoreCheck && !isKingInCheck(piece.side, gridObj)) {
                    var i,j,k,canCastle,checkRooks=[1,8],thisRook;
                    for (i=0;i<checkRooks.length;i++) {
                        thisRook = getPieceAtPosition(checkRooks[i],position.row,gridObj);
                        if (!thisRook.hasMoved) {
                            canCastle = true;
                            if (checkRooks[i] < position.column) {
                                j=checkRooks[i];
                                k=position.column-1;
                            } else {
                                j=position.column;
                                k=checkRooks[i]-1;
                            }
                            while (j<k) {
                                j++;
                                checkPosition = getPieceAtPosition(j,position.row,gridObj);
                                if (checkPosition.hasOwnProperty("side")) {
                                    canCastle = false;
                                } else if (j !== 2) { // king doesn't ever pass through column 2
                                    tempGridObj = $.extend(true, {}, gridObj);
                                    tempGridObj[position.row-1][position.column-1] = {};
                                    tempGridObj[position.row-1][j-1] = piece;
                                    if (isKingInCheck(piece.side, tempGridObj)) {
                                        canCastle = false;
                                    }
                                }
                            }
                            if (canCastle) {
                                if (checkRooks[i] < position.column) {
                                    moves.push({row: position.row, column: position.column-2, special: "castle"});
                                } else {
                                    moves.push({row: position.row, column: position.column+2, special: "castle"});
                                }
                            }

                        }
                    }
                }
            break;

        }
        if (!ignoreCheck) {
            for (i=0;i<moves.length;i++) {
                // filter out any move which results in a check on your king
                tempGridObj = $.extend(true, {}, gridObj);
                tempGridObj[position.row-1][position.column-1] = {};
                tempGridObj[moves[i].row-1][moves[i].column-1] = piece;
                if (!isKingInCheck(piece.side, tempGridObj)) {
                    validMoves.push(moves[i]);
                }
            }
        } else {
            validMoves = moves;
        }
        return validMoves;
    };

    const getAllValidMovesForSide = (side) => {
        let validMoves = [],
            i,j,gridObj = grid2Obj();
        for (i=0;i<8;i++) {
            for (j=0;j<8;j++) {
                if (gridObj[i][j].side === side) {
                    validMoves = validMoves.concat(getValidMovesForPiece(gridObj, gridObj[i][j], {row: i+1, column: j+1}));
                }
            }
        }
        return validMoves;
    };

    const showMoveAnnotation = ({prefix,column,row,captured,castled}) => {
        const currentPlayer = Board.getPlayer();
        let isCheck = '';
        column = String.fromCharCode(("a".codePointAt() + (column-1)));
        if (!getAllValidMovesForSide(currentPlayer).length) {
            isCheck = '#';
        }
        else if (isKingInCheck(currentPlayer, grid2Obj())) {
            isCheck = '+';
        }
        switch (castled) {
            case 'O-O-O':
                if (currentPlayer === 'Black') {
                    turnCount++;
                    notationString += `${turnCount}. ${castled}${isCheck} `; 
                }
                else {
                    notationString += `${castled}${isCheck} `;
                }
                break;
            case 'O-O':
                if (currentPlayer === 'Black') {
                    turnCount++;
                    notationString += `${turnCount}. ${castled}${isCheck} `; 
                }
                else {
                    notationString += `${castled}${isCheck} <br>`;
                }
                break;
            default:
                if (currentPlayer === 'Black') {
                    turnCount++;
                    if(!!captured) {
                        notationString += `${turnCount}. ${prefix}x`;
                    }
                    else {
                        notationString += `${turnCount}. ${prefix}`;
                    }
                    notationString += `${column}${row}${isCheck} `;
                }
                else {
                    if(!!captured) {
                        notationString += `${prefix}x`;
                    }
                    else {
                        notationString += `${prefix}`;
                    }
                    notationString += `${column}${row}${isCheck} <br>`;
                }
                break;
        }
        textnotation.innerHTML = notationString;
        textnotation.scrollTop = textnotation.scrollHeight;
    };
    let flipsButton = document.getElementById('toggleFlips')
    flipsButton.addEventListener('click', () => {
        Board.canFlip = !Board.canFlip;
        if(canFlip){
            flipsButton.textContent = 'Board Flips: Enabled';
        }
        else{
            flipsButton.textContent = 'Board Flips: Disabled';
        }
    });
    document.getElementById('copyButton').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('textnotation').textContent);
        alert("Copied the text: " + copyText.value);
    });
    
    $(".grid td").draggable({
        helper: function () {
            let helper = $("<i>").insertAfter(".grid");
            helper.attr("class", $(this).attr("class"));
            return helper;
        },
        revert: true,
        containment: ".grid",
        start: function () {
            let pos = getGridPosition(this),
                piece = getPieceAtPosition(pos.column,pos.row),
                validMoves = getValidMovesForPiece(grid2Obj(), piece, pos),
                i;
            $(this).draggable("option", "revert", true);
            $(this).css("border-color", "yellow");
            for (i in validMoves) {
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

    $(".grid .piece." + Board.getPlayer()).draggable( "enable" );
    $(".grid td").droppable({
        drop: function (event, ui) {
            Board.flip();
            let newPosition = getGridPosition(this),
                oldPosition = getGridPosition(ui.draggable[0]);

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
            
            $(".grid .piece." + Board.getPlayer()).draggable( "disable" );

            if (!getAllValidMovesForSide(Board.getPlayer()).length) {
                if (isKingInCheck(Board.getPlayer(), grid2Obj())) {
                    alertMessage.innerHTML = `Checkmate! ${Board.getPlayer()} Loses!`;
                } else {
                  alertMessage.innerHTML = 'Stalemate!';
                }
           } else {
             if (isKingInCheck(Board.getPlayer(), grid2Obj())) {
              alertMessage.innerHTML = `Check! ${Board.getPlayer()}'s Move`;
            } else {
              alertMessage.innerHTML = `${Board.getPlayer()}'s Move`;
            }
          }

          $(".grid .piece." + Board.getPlayer()).draggable( "enable" );
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
});
