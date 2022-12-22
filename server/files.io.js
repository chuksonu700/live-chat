var mysql = require("mysql");

var hostname = "gdk.h.filess.io";
var database = "portfolio_whichdawn";
var port = "3307";
var username = "portfolio_whichdawn";
var password = "10af1716fb03684151ce9ec954bb4540f6370eb3";

var con = mysql.createConnection({
  host: hostname,
  user: username,
  password,
  database,
  port,
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

con.query("SELECT * FROM accounts").on("result", function (row) {
  console.log(row);
});
