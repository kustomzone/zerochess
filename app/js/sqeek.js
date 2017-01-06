
// Open a database

// var SQL = window.SQL;
// var db = new SQL.open();
// const sqlite3 = SQL.open();
// var Database = sqlite3.Database;
// var Statement = sqlite3.Statement;

// var dataset;
// var DataType;

/*
var createStatement	= "CREATE TABLE IF NOT EXISTS Contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, useremail TEXT)";
var selectAllStatement = "SELECT * FROM Contacts";
var insertStatement	= "INSERT INTO Contacts (username, useremail) VALUES (?, ?)";
var updateStatement	= "UPDATE Contacts SET username = ?, useremail = ? WHERE id=?";
var deleteStatement	= "DELETE FROM Contacts WHERE id=?";
var dropStatement	  = "DROP TABLE Contacts";
*/

// var db = window.openDatabase("BLANK", "1.0", "Empty", 1000);
// Uncaught SecurityError: Access to the WebDatabase API is denied in this context

function initDatabase() {
	try {
		if (!window.openDatabase) { alert('Databases are not supported in this browser.');
		} else { console.log("Database ready.. (maybe)"); } // createTable();
	} catch (e) {
		if (e == 2) { console.log("Invalid database version."); // Version mismatch
		} else { console.log("Unknown error: " + e + "."); }
		return;
	}
}

function createTable() { // Function for Create Table in SQLite.
	db.transaction(function (tx) { tx.executeSql(createStatement, [], showRecords, onError); });
}

function insertRecord() { // Get value from Input and insert record . Function Call when Save/Submit Button Click..
		var usernametemp = $('input:text[id=username]').val();
		var useremailtemp = $('input:text[id=useremail]').val();
		db.transaction(function (tx) { tx.executeSql(insertStatement, [usernametemp, useremailtemp], loadAndReset, onError); });
		//tx.executeSql(SQL Query Statement,[ Parameters ] , Sucess Result Handler Function, Error Result Handler Function );
}

function deleteRecord(id) { // Get id of record . Function Call when Delete Button Click..
	var iddelete = id.toString();
	db.transaction(function (tx) { tx.executeSql(deleteStatement, [id], showRecords, onError); alert("Record Deleted"); });
	resetForm();
}

function updateRecord() { // Get id of record . Function Call when Delete Button Click.
	var usernameupdate = $('input:text[id=username]').val().toString();
	var useremailupdate = $('input:text[id=useremail]').val().toString();
	var useridupdate = $("#id").val();
	db.transaction(function (tx) { tx.executeSql(updateStatement, [usernameupdate, useremailupdate, Number(useridupdate)], loadAndReset, onError); });
}

function dropTable() { // Function Call when Drop Button Click.. Talbe will be dropped from database.
	db.transaction(function (tx) { tx.executeSql(dropStatement, [], showRecords, onError); });
	resetForm();
	initDatabase();
}

function loadRecord(i) { // Function for display records which are retrived from database.
	var item = dataset.item(i);
	$("#username").val((item['username']).toString());
	$("#useremail").val((item['useremail']).toString());
	$("#id").val((item['id']).toString());
}

function resetForm() { // Function for reset form input values.
	$("#username").val("");
	$("#useremail").val("");
	$("#id").val("");
}

function loadAndReset() { //Function for Load and Reset...
	resetForm();
	showRecords()
}

function onError(tx, error) { // Function for Hendeling Error...
	alert(error.message);
}
 
function showRecords() { // Function For Retrive data from Database Display records as list
	$("#results").html('');
	db.transaction(function (tx) {
		tx.executeSql(selectAllStatement, [], function (tx, result) {
			dataset = result.rows;
			for (var i = 0, item = null; i < dataset.length; i++) {
				item = dataset.item(i);
				var linkeditdelete = '<li>' + item['username'] + ' , ' + item['useremail'] + '	' + '<a href="#" onclick="loadRecord(' + i + ');">edit</a>' + '	' + '<a href="#" onclick="deleteRecord(' + item['id'] + ');">delete</a></li>';
				$("#results").append(linkeditdelete);
			}
		});
	});
}

/*
var f = {
	mimeType: 'application/x-sqlite-3',
	filename: 'test.sqlite',
	url: undefined,
	downloadUrl: undefined
}
*/

// SFX for loading & saving (buzz.min.js)
// var volume = 5;
// var soundLoaded = new buzz.sound("ext/ogg/sfx_flap.ogg"); // loading
// var soundSwoosh = new buzz.sound("ext/ogg/sfx_swooshing.ogg"); // saving
// buzz.all().setVolume(volume);

// SQL commands
function execute(commands) {
	// update log
	var com  = commands.replace(/\n/g, '; ');
	var con  = document.getElementById('myconsole');
	var pre  = document.createElement('pre');
	var span = document.createElement('span');
	span.style.color = 'red';
	con.appendChild(pre).innerHTML = com;
	console.debug(commands);
	try {
		var data = db.exec(com);
		var txt  = JSON.stringify(data, null, '  ');
		out_edit.setValue(txt);
		return data;
	}
	catch (e) { console.error(e); e=e+'<br><br>'; con.appendChild(span).innerHTML = e; }
}

// Handle browsed file
$('#fileselect').change(function (e) {
	if (this.value) {
		var file = this.files[0]; // alert("name: " + file.name + ", size: " + file.size);
		var reader = new FileReader();
		// reader.readAsDataURL(file);      // blob
		// reader.readAsBinaryString(file); // binary
		reader.readAsArrayBuffer(file);     // arraybuffer
		reader.onload = function(e) { loadTables(e.target.result, file); };
		reader.onerror = function() {
			$(fileStatus)
				.addClass('alert-error') // error
				.removeClass('hidden');
			fileStatus.innerText = 'Error! Unable to open file ' + file.name + ' size:' + file.size;
		};
	}
});

// Handle dropped file
function doDrop(event, cb) {
	var file = event.dataTransfer.files[0];
	var reader = new FileReader();
	reader.readAsArrayBuffer(file);
	reader.onload = function(e) { loadTables(e.target.result, file); };
	reader.onerror = function() {
		$(fileStatus)
			.addClass('alert-error') // error
			.removeClass('hidden');
		fileStatus.innerText = 'Error! Unable to open file ' + file.name + ' size:' + file.size;
	};
}

// Handle static file reference (ajax)
function doSelect(filepath) {
	var url = "http://127.0.0.1:43110/1CHESSMTP3DDGu4VdrPEhp6gfHLseed2Xg/" + filepath;
	var con = document.getElementById('myconsole');
	var pre = document.createElement("pre");
	con.appendChild(pre).innerHTML = url;
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = "arraybuffer";
	xhr.onload = function (event) { loadTables(xhr.response, filepath); };
	xhr.send();
}

// Handle static file reference (fs)
function doSelect2(fileName) {
  pgnData = readPgn(fileName);
  initPgn();
}

// DB-loaders (static reference)
dbLink0.onclick = function(event) { doSelect2(dbLink0.value); }
dbLink1.onclick = function(event) { doSelect2(dbLink1.value); }
// dbLink2.onclick = function(event) { doSelect2(dbLink2.value); }
// dbLink3.onclick = function(event) { doSelect2(dbLink3.value); }
// dbLink4.onclick = function(event) { doSelect2(dbLink4.value); }
dbLink5.onclick = function(event) { doSelect2(dbLink5.value); }
dbLink6.onclick = function(event) { doSelect2(dbLink6.value); }
// dbLink7.onclick = function(event) { doSelect(dbLink7.value); }
// dbLink8.onclick = function(event) { doSelect(dbLink8.value); }
// dbLink9.onclick = function(event) { doSelect(dbLink9.value); }

// drag in
function dragIn(z)  { ['dragOut','error','success'].forEach(function(e) {   z.classList.remove(e); }); }

// drag out
function dragOut(z) { ['dragEnter','error','success'].forEach(function(e) { z.classList.remove(e); }); }

// on drag enter
zone.ondragenter = function(){ dragIn(zone);  return false; };

// on drag over
zone.ondragover = function() { dragIn(zone);  return false; };

// on drag leave
zone.ondragleave = function(){ dragOut(zone); return false; };

// inherits
function inherits(target, source) { for (var k in source.prototype) { target.prototype[k] = source.prototype[k]; } }

// sql shell command
// sqlButt.onclick	= function(event) { execute(commands.value); };


// on drop
zone.ondrop = function(event) {
	
	doDrop(event,function(x) {
		db=SQL.open(x);
		var q = "SELECT name FROM sqlite_master WHERE type='table';";
		result = execute(q);
		$('.tables').empty();
		$.each(result, function (i, row) {
			$(".tables").append(
				$("<li />").append($("<a />")
					.attr("href", "#table_" + row[0].value)
					.attr("data-table", row[0].value)
					.attr("data-toggle", "tab")
					.text(row[0].value)
					.on('click', showTable)
				)
			)
		});
	});
	dragOut(zone);
	return false;
};


// load db tables
function loadTables(arraybuffer, file) {
	// re-init
	zone.classList.remove('error');
	zone.classList.remove('success');
	
	var data = new Uint8Array(arraybuffer);
	db = SQL.open(data);
	var commands = "SELECT name FROM sqlite_master WHERE type='table';";
	var result = db.exec(commands.replace(/\n/g, '; '));
	$('.tables').empty();
	$.each(result, function (i, row) {
		$(".tables").append(
			$("<li />").append($("<a />")
				.attr("href", "#table_" + row[0].value)
				.attr("data-table", row[0].value)
				.attr("data-toggle", "tab")
				.text(row[0].value)
				.on('click', showTable)
			)
		)
	});
	$(fileStatus)
		.addClass('alert-success') // success
		.removeClass('hidden');
	if (file) {
		// soundLoaded.play();
		$("#loaded").hide();
		$("#loaded").css("visibility", "visible");
		$("#loaded").fadeIn(1000);
		// or swoosh!
		// soundSwoosh.stop();
		// soundSwoosh.play();
		
		if (file.name) { var size = file.size; var name = file.name;
		} else {		 var size = data.byteLength; var name = file; } // file.substring();
		fileStatus.innerText = 'Opened: ' + name + ', size: ' + Math.floor(size/1000) + "k";
	} else { fileStatus.innerText ='no file details'; }
}


// show current table
function showTable(e) {
	var $el = $(this),
	$table = $(".table-container"),
	table = $el.data("table"),
	q = "SELECT * FROM " + table  + " LIMIT 25;";

	$(".new-row").removeClass("hidden");
	$table.empty();
	result = execute(q);
	$.each(result, function (i, row) {
		var $tr = $("<tr />"),
			$thead_tr = $("<tr />"),
			$tbody = $("<tbody />"),
			$thead = $("<thead />");
		if (i==0) {
			$.each(row, function (k, header) {
				$thead.append(
					$thead_tr.append(
						$("<th />") .text(header.column)
					)
				);
			});
			$table.append($thead);
		}
		$table.append($tbody);
		$.each(row, function (j, cell) {
			$tbody.append(
				$tr.append(
					$("<td />") .text(cell.value)
				)
			);
		});
	});
}


// new row
$("#id_new-row-modal").on("show", function () {
	var table = $(".nav-tabs .active a").data("table");
	result = execute("pragma table_info('" + table + "');");
	$(".new-row-form").empty();
	$.each(result, function (i, col) {
		// pk check
		if (col[5].value === "0") {
			$(".new-row-form")
				.data("table", table)
				.append(
					$("<div />")
						.addClass("control-group")
						.append($("<label />")
							.addClass("control-label")
							.attr("for", "id_" + col[1].value)
							.text(col[1].value)
						)
						.append($("<div />")
							.addClass("controls")
							.append($("<input />")
								.data("col", col[1].value)
								.attr("type", "text")
								.attr("id", "id_" + col[1].value)
							)
						)
				)
		}
	});
});

// save row
$(".row-save").on("click", function () {
	var table = $(".new-row-form").data("table"),
		props = $(".new-row-form input").map(function () { return $(this).data("col"); }).toArray(),
		vals = $(".new-row-form input").map(function () { return $(this).val(); }).toArray();
		q = "INSERT INTO `" + table + "` (" + props.join(", ") + ")" + " VALUES ('" + vals.join("', '") + "')";
	result = execute(q);
	$(".nav-tabs .active a").triggerHandler("click");
});

// ?
$("[data-toggle=tooltip]").tooltip();

// DB-drag start
// dbDrag.ondragstart = function(event) { event.dataTransfer.setData('DownloadUrl', f.downloadUrl); };

// DB-drag end
// dbDrag.ondragend   = function(event) { dbDrag.style.display = 'none'; };

// dbLink.onclick  = function(event) { grabDB(function() { dbDrag.style.display = 'inherit'; }); };

/*
// make DB file (export/save)
function grabDB(cb) {
	var blob = new Blob([db.exportData()],{type: f.mimeType});

	var reader = new FileReader();
	reader.onload = function(e) {
		f.url = e.target.result;
		f.downloadUrl = f.mimeType + ':' + f.filename + ':' + f.url;
		console.log('database size:'+f.url.length);
		cb(e.target.result); // added (e.target.result)
	};
	reader.readAsDataURL(blob);
}
*/

/*
// normalize
function normalizeMethod (fn) {
	return function (sql) { var errBack;
		var args = Array.prototype.slice.call(arguments, 1);
		if (typeof args[args.length - 1] === 'function') {
			var callback = args[args.length - 1];
			errBack = function(err) { if (err) { callback(err); } };
		}
		var statement = new Statement(this, sql, errBack);
		return fn.call(this, statement, args);
	}
}
*/


/* eof */
