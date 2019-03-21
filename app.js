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

        // save items to "Item" (empty) inside "todolistDB"
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
    const listName = req.body.list;
    const newItem = new itemModel({name: itemName});

    if (listName === "Today") {
        newItem.save(); // save "newItem" into "Item" inside "todoListDB"
        res.redirect('/');
    } else {
        listModel.findOne({name: listName}, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                result.items.push(newItem);
                result.save();
            }
        });
        res.redirect("/" + listName);
    }
});

app.post("/delete", function (req, res) {
    const listName = req.body.listTitle;
    const itemName = req.body.checkbox;

    if (listName === "Today") {
        itemModel.deleteOne({name: itemName}, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Successfully removed item " + "\"" + itemName + "\"" + " from DB");
            }
        });
        res.redirect('/');
    } else {
        // find the item and remove it
        // $pull operator removes from an existing array all instances of a value or values that match a specified condition
        listModel.findOneAndUpdate({name: listName}, {$pull: {items: {name: itemName}}}, (err) => {
            if (!err) {
                res.redirect('/' + listName);
            }
        });

    }
});

app.get("/work", function (req, res) {
    res.render("list", {listTitle: "Work List", newListItems: defaultItems});
});

app.get("/about", function (req, res) {
    res.render("about");
});

app.get("/:customListName", (req, res) => {
    const customListName = req.params.customListName.charAt(0).toUpperCase() +
                            req.params.customListName.slice(1).toLowerCase();

    // fix multiple "today"
    if (customListName === "Today") {
        res.redirect('/');
    } else {
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
                    res.render('list', {listTitle: customListName});
                } else {
                    res.render("list", {listTitle: results[0].name, newListItems: results[0].items});
                    console.log('Duplicate the List');
                }
            }
        });
    }
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
