//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongooes = require("mongoose");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// connect to MongoDB
mongooes.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

// create Schema of item
const itemSchema = new mongooes.Schema({
    name: String
});

// create Model
const itemModel = mongooes.model("Item", itemSchema);

// create items
const item_1 = new itemModel({name: "Laptop dell"});
const item_2 = new itemModel({name: 'Pencil 2B'});
const item_3 = new itemModel({name: 'HDD Seagate 1TB'});

const defaultItems = [item_1, item_2, item_3];

// create Schema of listitem
const listSchema = {
    name: String,
    items: [itemSchema]
};

const listModel = mongooes.model("List", listSchema);

app.get("/", function (req, res) {
    itemModel.find({}, (err, foundItems) => {

        // save items to "Item" inside "todolistDB"
        if (foundItems.length === 0) {
            itemModel.insertMany(defaultItems, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully added items to DB");
                }
            });
        }
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    });
});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;

    const newItem = new itemModel({name: itemName});

    newItem.save();
    res.redirect('/');
});

app.post("/delete", function (req, res) {
    itemModel.deleteOne({name: req.body.checkbox}, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Successfully removed item " + "\"" + req.body.checkbox + "\"" + " from DB");
        }
    });
    res.redirect('/');
});

app.get("/work", function (req, res) {
    res.render("list", {listTitle: "Work List", newListItems: defaultItems});
});

app.get("/about", function (req, res) {
    res.render("about");
});

app.get("/:customListName", (req, res) => {
    const customListName = req.params.customListName;

    // check whether there's a list that has the same name as the new "customListName"
    listModel.find({name: customListName}, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            if (results.length === 0) {
                new listModel({
                    name: customListName,
                    items: defaultItems
                }).save();
                res.redirect('/');
            } else {
                res.render("List", {listTitle: results[0].name, newListItems: results[0].items});
                console.log('Duplicate the List');
            }
        }
    });
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
