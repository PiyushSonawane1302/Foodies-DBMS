//jshint esversion:6

require('dotenv').config()
const mysql = require('mysql');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const express = require('express');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

var conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: "foodorder"
});

conn.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

var user;
var cartItems = 0;
var itemname;
var itemprice;
var itemid;
var quantity;
var cartArr = []
var cartItem;
var total = 0;

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/signin", function (req, res) {
  res.render("signin")
});

app.post("/signin", function (req, res) {

  var userName = req.body.username;
  var password = req.body.password;

  user = userName;

  var sql = "SELECT username,password FROM users WHERE username=?";

  var values = [
    [userName]
  ];

  conn.query(sql, values, function (err, founduser) {
    if (!err) {
      bcrypt.compare(password, founduser[0].password, function (err, result) {
        if (result == true) {
          console.log("Login Successful !");
          res.redirect("/foodies");
        } else {
          res.send("Please Check Your Password !");
        }
      });
    }
  });
});


app.get("/foodies", function (req, res) {

  var sql = "SELECT * FROM fooditems ORDER BY food_id";

  conn.query(sql, function (err, result) {
    var totalItems = result.length;
    res.render("foodlist", { username: user, cartItems: cartItems, itemCount: totalItems, fooditems: result });
  });

});


app.get("/signup", function (req, res) {
  res.render("signup");
});


app.post("/signup", function (req, res) {
  var fullName = req.body.firstname + " " + req.body.lastname;
  var userName = req.body.username;
  var address = req.body.address;
  var email = req.body.email;
  var contact = req.body.contact;
  var password = req.body.password;
  var zipcode = req.body.zipcode;

  bcrypt.hash(password, saltRounds, function (err, hash) {
    if (err) {
      console.log(err);
    } else {
      var sql = "INSERT INTO users (username,fullname,contact,address,password,email,zipcode) VALUES ?";
      var values = [
        [userName, fullName, contact, address, hash, email, zipcode]
      ];
      conn.query(sql, [values], function (err, result) {
        if (err) console.log("Couldnt enter data: " + err.message);
        else {
          console.log("user inserted");
          res.redirect("/success");
        }
      });
    }
  });
});


app.get("/success", function (req, res) {
  res.render("success");
});


app.get("/logout", function (req, res) {
  itemCount = 0;
  cartItems = 0;
  total = 0;
  cartArr = []
  res.redirect("/")
});


app.post("/addtocart", function (req, res) {
  cartItems++;
  itemname = req.body.hiddenname;
  itemprice = req.body.hiddenprice;
  itemid = req.body.hiddenid;
  quantity = req.body.quantity;
  total += Number(itemprice * quantity);
  cartItem = {
    itemid: itemid,
    itemname: itemname,
    itemprice: itemprice,
    quantity: quantity
  }
  cartArr.push(cartItem);
  res.redirect("/foodies");
});


app.get("/cart", function (req, res) {
  res.render("cart", { cartItems: cartArr, totalPrice: total })
});


app.get("/orderhistory", function (req, res) {

  var sql = "SELECT * FROM orders WHERE username = ?"

  conn.query(sql, [user], function (err, result) {
    if (err) console.log("Couldnt enter data: " + err.message);
    else {
      res.render("orderhistory", { orders: result });
    }
  });
});


app.get("/emptycart", function (req, res) {
  cartItems = 0;
  total = 0;
  cartArr = []
  res.redirect("/foodies");
});


app.post("/remove", function (req, res) {
  var index = 0;
  var price = 0;
  var quantity = 0;
  index = req.body.hiddencartitemid;
  price = req.body.hiddencartitemprice;
  quantity = req.body.hiddencartitemquantity;
  cartArr.splice(index, 1);
  var cost = price * quantity;
  total -= cost;
  res.redirect("/cart");
});


app.get("/payments", function (req, res) {
  res.render("payments", { grandTotal: total });
});


app.get("/cod", function (req, res) {

  var orderNumber = Math.floor((Math.random() * 10000000000000000000) + 1);
  var sql = "INSERT INTO orders (username,order_number,amount_paid) VALUES ? ";

  var values = [
    [user, orderNumber, total]
  ];

  if (total != 0) {
    conn.query(sql, [values], function (err, result) {
      if (err) console.log("Couldnt enter data: " + err.message);
      else {
        res.render("cod", { ordernumber: orderNumber });
      }
    });
  } else {
    res.redirect("/foodies");
  }

  total = 0;
  cartItems = 0;
  cartArr = []

});


app.get("/onlinepayment", function (req, res) {
  res.render("onlinepayment");
});


app.listen(3000, function () {
  console.log("Server Started on port 3000 !");
});

