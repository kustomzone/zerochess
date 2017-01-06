
/* BOARD UI */

var g_startOffset = null;
var g_selectedPiece = null;
var moveNumber = 1;
var gameMoves = 0;
var currentMove = "";

var g_allMoves = [];
var g_playerWhite = true;
var g_changingFen = false;
var g_analyzing = false;

var g_uiBoard;
var g_cellSize = 55;
var g_pieceSize = 45;

function UINewGame() {
    moveNumber = 1;

    var pgnTextBox = document.getElementById("moves");
    pgnTextBox.value = "";

    EnsureAnalysisStopped();
    ResetGame();
    if (InitializeBackgroundEngine()) {
        g_backgroundEngine.postMessage("go");
    }
    g_allMoves = [];
    RedrawBoard();

    if (!g_playerWhite) {
        SearchAndRedraw();
    }
}

function EnsureAnalysisStopped() {
    if (g_analyzing && g_backgroundEngine != null) {
        g_backgroundEngine.terminate();
        g_backgroundEngine = null;
    }
}

function UIAnalyzeToggle() {
    if (InitializeBackgroundEngine()) {
        if (!g_analyzing) {
            g_backgroundEngine.postMessage("analyze");
        } else {
            EnsureAnalysisStopped();
        }
        g_analyzing = !g_analyzing;
        document.getElementById("AnalysisToggleLink").innerText = g_analyzing ? "Analysis: On" : "Analysis: Off";
    } else {
        alert("Your browser must support web workers for analysis - (chrome4, ff4, safari)");
    }
}

function UIChangeFEN() {
    if (!g_changingFen) {
        var fenTextBox = document.getElementById("more-options");
        var result = InitializeFromFen(fenTextBox.value);
        if (result.length != 0) {
            UpdatePVDisplay(result);
            return;
        } else {
            UpdatePVDisplay('');
        }
        g_allMoves = [];

        EnsureAnalysisStopped();
        InitializeBackgroundEngine();

        g_playerWhite = !!g_toMove;
        g_backgroundEngine.postMessage("position " + GetFen());

        RedrawBoard();
    }
}

function UIChangeStartPlayer() {
    g_playerWhite = !g_playerWhite;
    RedrawBoard();
}

function UpdatePgnTextBox(move) {
    var pgnTextBox = document.getElementById("moves");
	if (!pgnTextBox.value) { nL = ''; } else { var nL = "\\\n"; } // newline 'after' first move
    if (g_toMove != 0) {
        pgnTextBox.value += nL + moveNumber + ". "; // actually it's before the next move
        moveNumber++;
    }
    pgnTextBox.value += GetMoveSAN(move) + "   ";
	pgnTextBox.value = pgnTextBox.value.replace("\\", ''); // regex fix *cough*
	if (g_toMove == 0) {
		var lastMove = gameMoves;
		var currentMoves = pgnTextBox.value;
		gameMoves = currentMoves.length;
		var newMove = gameMoves-lastMove;
		if (lastMove) {
			currentMove = currentMoves.substring(gameMoves-newMove,gameMoves);
		} else {
			currentMove = pgnTextBox.value;
		}
	}
}

function UIChangeTimePerMove() {
    var timePerMove = document.getElementById("TimePerMove");
    g_timeout = parseInt(timePerMove.value, 10);
}

function FinishMove(bestMove, value, timeTaken, ply) {
    if (bestMove != null) {
        UIPlayMove(bestMove, BuildPVMessage(bestMove, value, timeTaken, ply));
    } else {
        alert("Checkmate!");
    }
}

function UIPlayMove(move, pv) {
    UpdatePgnTextBox(move);

    g_allMoves[g_allMoves.length] = move;
    MakeMove(move);
    UpdatePVDisplay(pv);
    UpdateFromMove(move);
}

function UIUndoMove() {
  if (g_allMoves.length == 0) {
    return;
  }
  
  UndoPgnTextBox(g_allMoves.length/2);
  
  if (g_backgroundEngine != null) {
    g_backgroundEngine.terminate();
    g_backgroundEngine = null;
  }
  
  UnmakeMove(g_allMoves[g_allMoves.length - 1]);
  g_allMoves.pop();
  
  if (g_playerWhite != !!g_toMove && g_allMoves.length != 0) {
    UnmakeMove(g_allMoves[g_allMoves.length - 1]);
    g_allMoves.pop();
  }
  RedrawBoard();
}

function UndoPgnTextBox(move) {
	var moveLength = currentMove.length;
    var pgnTextBox = document.getElementById("moves");
	if (pgnTextBox.value) {
		var currentMoves = pgnTextBox.value;
		var gameLength = currentMoves.length;
		gameMoves = gameLength-moveLength;
		pgnTextBox.value = currentMoves.substring(0,gameMoves);
		moveNumber--;
	}
}

function UpdatePVDisplay(pv) {
    if (pv != null) {
        var outputDiv = document.getElementById("output");
        if (outputDiv.firstChild != null) {
            outputDiv.removeChild(outputDiv.firstChild);
        }
        outputDiv.appendChild(document.createTextNode(pv));
    }
}

function SearchAndRedraw() {
    if (g_analyzing) {
        EnsureAnalysisStopped();
        InitializeBackgroundEngine();
        g_backgroundEngine.postMessage("position " + GetFen());
        g_backgroundEngine.postMessage("analyze");
        return;
    }

    if (InitializeBackgroundEngine()) {
        g_backgroundEngine.postMessage("search " + g_timeout);
    } else {
	Search(FinishMove, 99, null);
    }
}

var g_backgroundEngineValid = true;
var g_backgroundEngine;

function InitializeBackgroundEngine() {
    if (!g_backgroundEngineValid) {
        return false;
    }

    if (g_backgroundEngine == null) {
        g_backgroundEngineValid = true;
        try {
            g_backgroundEngine = new Worker("./app/js/garbochess.js");
            g_backgroundEngine.onmessage = function (e) {
                if (e.data.match("^pv") == "pv") {
                    UpdatePVDisplay(e.data.substr(3, e.data.length - 3));
                } else if (e.data.match("^message") == "message") {
                    EnsureAnalysisStopped();
                    UpdatePVDisplay(e.data.substr(8, e.data.length - 8));
                } else {
                    UIPlayMove(GetMoveFromString(e.data), null);
                }
            }
            g_backgroundEngine.error = function (e) {
                alert("Error from background worker:" + e.message);
            }
            g_backgroundEngine.postMessage("position " + GetFen());
        } catch (error) {
            g_backgroundEngineValid = false;
        }
    }

    return g_backgroundEngineValid;
}

function UpdateFromMove(move) {
    var fromX = (move & 0xF) - 4;
    var fromY = ((move >> 4) & 0xF) - 2;
    var toX = ((move >> 8) & 0xF) - 4;
    var toY = ((move >> 12) & 0xF) - 2;

    if (!g_playerWhite) {
        fromY = 7 - fromY;
        toY = 7 - toY;
        fromX = 7 - fromX;
        toX = 7 - toX;
    }

    if ((move & moveflagCastleKing) ||
        (move & moveflagCastleQueen) ||
        (move & moveflagEPC) ||
        (move & moveflagPromotion)) {
        RedrawPieces();
    } else {
        var fromSquare = g_uiBoard[fromY * 8 + fromX];
        $(g_uiBoard[toY * 8 + toX])
            .empty()
            .append($(fromSquare).children());
    }
}

function RedrawPieces() {
    for (y = 0; y < 8; ++y) {
        for (x = 0; x < 8; ++x) {
            var td = g_uiBoard[y * 8 + x];
            var pieceY = g_playerWhite ? y : 7 - y;
            var piece = g_board[((pieceY + 2) * 0x10) + (g_playerWhite ? x : 7 - x) + 4];
            var pieceName = null;
            switch (piece & 0x7) {
                case piecePawn:   pieceName = "pawn";   break;
                case pieceKnight: pieceName = "knight"; break;
                case pieceBishop: pieceName = "bishop"; break;
                case pieceRook:   pieceName = "rook";   break;
                case pieceQueen:  pieceName = "queen";  break;
                case pieceKing:   pieceName = "king";   break;
            }
            if (pieceName != null) {
                pieceName += (piece & 0x8) ? "_white" : "_black";
                var img = document.createElement("img");
				img.src = "app/img/chesspieces/" + pieceName + ".png";
                img.style.width  = g_pieceSize + "px";
                img.style.height = g_pieceSize + "px";
                var divimg = document.createElement("div");
                divimg.width  = g_cellSize + "px";
                divimg.height = g_cellSize + "px";
				divimg.style.padding = "5px";
                divimg.appendChild(img);

                $(divimg).draggable({ start: function (e, ui) {
                    if (g_selectedPiece === null) {
                        g_selectedPiece = this;
                        var offset = $(this).closest('table').offset();
                        g_startOffset = {
                            left: e.pageX - offset.left,
                            top: e.pageY - offset.top
                        };
                    } else {
                        return g_selectedPiece == this;
                    }
                }});

                $(divimg).mousedown(function(e) {
                    if (g_selectedPiece === null) {
                        var offset = $(this).closest('table').offset();
                        g_startOffset = {
                            left: e.pageX - offset.left,
                            top: e.pageY - offset.top
                        };
                        e.stopPropagation();
                        g_selectedPiece = this;
                        g_selectedPiece.style.backgroundImage = "url('app/img/select.png')";
                    } else if (g_selectedPiece === this) {
                        g_selectedPiece.style.backgroundImage = null;
                        g_selectedPiece = null;
                    }
                });

                $(td).empty().append(divimg);
            } else {
                $(td).empty();
            }
        }
    }
}

function RedrawBoard() {
    var div = $("#board1")[0];
    var table = document.createElement("table");
    table.cellPadding = "0px";
    table.cellSpacing = "0px";
    $(table).addClass('no-highlight');

    var tbody = document.createElement("tbody");

    g_uiBoard = [];

    var dropPiece = function (e, ui) {
        var endX = e.pageX - $(table).offset().left;
        var endY = e.pageY - $(table).offset().top;

        endX = Math.floor(endX / g_cellSize);
        endY = Math.floor(endY / g_cellSize);

        var startX = Math.floor(g_startOffset.left / g_cellSize);
        var startY = Math.floor(g_startOffset.top / g_cellSize);

        if (!g_playerWhite) {
            startY = 7 - startY;
            endY = 7 - endY;
            startX = 7 - startX;
            endX = 7 - endX;
        }

        var moves = GenerateValidMoves();
        var move = null;
        for (var i = 0; i < moves.length; i++) {
            if ((moves[i] & 0xFF) == MakeSquare(startY, startX) &&
                ((moves[i] >> 8) & 0xFF) == MakeSquare(endY, endX)) {
                move = moves[i];
            }
        }

        if (!g_playerWhite) {
            startY = 7 - startY;
            endY = 7 - endY;
            startX = 7 - startX;
            endX = 7 - endX;
        }

        g_selectedPiece.style.left = 0;
        g_selectedPiece.style.top = 0;

        if (!(startX == endX && startY == endY) && move != null) {
            UpdatePgnTextBox(move);

            if (InitializeBackgroundEngine()) {
                g_backgroundEngine.postMessage(FormatMove(move));
            }

            g_allMoves[g_allMoves.length] = move;
            MakeMove(move);

            UpdateFromMove(move);

            g_selectedPiece.style.backgroundImage = null;
            g_selectedPiece = null;

            var fen = GetFen();
            document.getElementById("more-options").value = fen;

            setTimeout("SearchAndRedraw()", 0);
        } else {
            g_selectedPiece.style.backgroundImage = null;
            g_selectedPiece = null;
        }
    };

    for (y = 0; y < 8; ++y) {
        var tr = document.createElement("tr");
        // tr.style.width = g_cellSize + "px";
        // tr.style.height = g_cellSize + "px";
		
        for (x = 0; x < 8; ++x) {
            var td = document.createElement("td");
            td.style.minWidth  = g_cellSize + "px";
            td.style.minHeight = g_cellSize + "px";
            td.style.backgroundColor = ((y ^ x) & 1) ? "#b58863" : "#f0d9b5"; // "#D18947" : "#FFCE9E";
            tr.appendChild(td);
            g_uiBoard[y * 8 + x] = td;
        }
		// board numbers
		var thY = document.createElement("th");
		thY.style.width  = "18px";
		thY.style.height = "55px";
		thY.style.paddingLeft = "12px";
		thY.style.verticalAlign = "middle";
		thY.style.color = "#D4C2A0"
		thY.innerText = Math.abs((g_playerWhite) * 8 - y) + Math.abs(g_playerWhite - 1);
		tr.appendChild(thY);
        tbody.appendChild(tr);
    }
	
	// board letters
	var tr = document.createElement("tr");
	for (i = 0; i < 8; ++i) {
		var thX = document.createElement("th");
		thX.style.width  = "55px";
		thX.style.height = "40px";
		thX.style.verticalAlign = "middle";
		thX.style.textAlign = "center";
		thX.style.color = "#D4C2A0";
		thX.innerText = String.fromCharCode(65 + Math.abs((g_playerWhite - 1) * 8 + i) - Math.abs(g_playerWhite - 1));
		tr.appendChild(thX);
	}
	tbody.appendChild(tr);
	
    table.appendChild(tbody);

    $('body').droppable({ drop: dropPiece });
    $(table).mousedown(function(e) {
        if (g_selectedPiece !== null) {
            dropPiece(e);
        }
    });

    RedrawPieces();

    $(div).empty();
    div.appendChild(table);

    g_changingFen = true;
    document.getElementById("more-options").value = GetFen();
    g_changingFen = false;
}
