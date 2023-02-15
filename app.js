//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDoList!"
});
const item2 = new Item({
  name: "Hit the + button to add new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
})

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function (req, res) {
  const day = date.getDate();

  Item.find(function (err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added in Items");
        }
        res.redirect("/");
      });
      
    }
    else {
      res.render("list", { listTitle: day, newListItems: items });
    }
  });
});


app.get("/:clist", function (req, res) {
  const clist = _.capitalize(req.params.clist);

  List.findOne({ name: clist }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: clist,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + clist);
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });
});


app.post("/", function (req, res) {
  const day = date.getDate();
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);

    })
  }


  // const item = req.body.newItem;
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete", function (req, res) {
  const day = date.getDate();
  const checkedItem = req.body.checkbox;
  const listItem = req.body.listItem;

  if (listItem === day) {
    Item.findByIdAndRemove(checkedItem, function (err) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("Successfully remove item from list");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({name: listItem}, {$pull: {items: {_id: checkedItem}}}, function(err, foundItem){
      if(!err){
        res.redirect("/" + listItem);
      }
    });
  };

});



// app.get("/work", function (req, res) {
//   res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started on port 3000");
});
