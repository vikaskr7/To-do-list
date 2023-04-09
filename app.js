const express = require("express"); // import the express library
const bodyParser = require("body-parser"); // import the body-parser middleware
const mongoose = require("mongoose"); // import the mongoose library
const { name } = require("ejs");
const _ = require("lodash") ;

const app = express(); // create an instance of the express application

// set the view engine to EJS
app.set('view engine', 'ejs');

// use the body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({extended: true}));

// serve static files from the "public" directory
app.use(express.static("public"));

// connect to the local MongoDB database
mongoose.connect("mongodb+srv://admin-vikas:test123@cluster0.rvpqwbt.mongodb.net/todolistDB" ,{useNewUrlParser: true});

// define the schema for to-do list items
const itemsSchema = {
  name : String 
};

// create a mongoose model for to-do list items
const Item = mongoose.model("Item", itemsSchema);

// create some default to-do list items
const item1 = new Item({
  name : "Welcome to your to-do-list."
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

// put the default items into an array
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items:[itemsSchema]
}; 

const List = mongoose.model("List", listSchema)

// define a route handler for the main route ("/")
app.get("/", async function(req, res) {

  try {
    // find all items in the database
    const foundItems = await Item.find({});

    // if the database is empty, insert the default items and redirect back to the main route
    if(foundItems.length === 0){
      await Item.insertMany(defaultItems);
      console.log("Successfully saved default items to DB.");
      res.redirect("/") ;
    } 
    // if there are items in the database, render the "list" view and pass the items as the "newListItems" property
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  } catch (err) {
    // if an error occurs while retrieving items from the database, send a 500 (Internal Server Error) response
    console.log(err);
    res.status(500).send("Error occurred while retrieving items.");
  }

});


app.get("/:customListName", async function(req, res){
  const customListName = _.capitalize(req.params.customListName) ;

  try {
    const foundList = await List.findOne({name: customListName});
    
    if(!foundList){
      console.log("Does't exist") ;
      //cerate a new List
      const list = new List({
        name: customListName , 
        item: defaultItems
      });

      await list.save() ;
      res.redirect("/" + customListName) ;

    } else{
      
      // Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    }
  } catch (err) {
    console.log(err);
  }
});

// define a route handler for HTTP POST requests to the main route ("/")
app.post("/", async function(req, res){

  // get the name of the new item from the request body
  const itemName = req.body.newItem;
  const listName = req.body.list ;

  // adding a new item into the list
  const item =new Item ({
    name : itemName
  });

  if(listName === "Today"){
    await item.save() ;
    res.redirect("/") ;
  }
  else{
    try {
      const foundList = await List.findOne({name: listName}) ;
      foundList.items.push(item) ;
      await foundList.save() ;
      res.redirect("/" + listName) ;
    } catch (err) {
      console.log(err) ;
    }
  }
});

// Listen for a POST request to the "/delete" endpoint
app.post("/delete", async function(req, res) {
  // Get the ID of the checked item from the request body
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName ;

  if(listName === "Today"){
    try {
      // Find and delete the item with the specified ID using findOneAndDelete()
      await Item.findOneAndDelete({_id: checkedItemId});

      // If the deletion is successful, log a message to the console and redirect the user to the homepage
      console.log("Successfully deleted checked item");
      res.redirect("/");
    } catch (err) {
      // If an error occurs during the deletion process, log the error to the console and send an HTTP 500 status code along with an error message to the client
      console.log(err);
      res.status(500).send("Error deleting item");
    }
  } else {
    try {
      // Find the list with the specified name and remove the item with the specified ID using $pull operator
      await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
  
      // If the deletion is successful, redirect the user to the list page
      res.redirect("/" + listName);
    } catch (err) {
      // If an error occurs during the deletion process, log the error to the console and send an HTTP 500 status code along with an error message to the client
      console.log(err);
      res.status(500).send("Error deleting item");
    }
  }
});


// define a route handler for the "About" page ("/about")
app.get("/about", function(req, res){
  // render the "about" view
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});





// .then is used as callback function and in case of no error 
// .catch is used as else statement in case of error
// Item.insertMany(defaultItems)
//   .then(() => {
//     console.log("Successfully saved default items to DB.") ;
//   })
//   .catch((err) => {
//     console.log(err) ; 
//   });


// This will not work in newer version
// Item.insertMany(defaultItems, function(err){
//   if(err){
//     console.log(err) ; 
//   }
//   else{
//     console.log("Successfully saved default items to DB.") ;
//   }
// }) ;


// app.get("/", function(req, res) {
//   Item.find({})
//     .then(function(foundItems) {
//       console.log(foundItems);
//       res.render("list", {listTitle: "Today", newListItems: foundItems});
//     })
//     .catch(function(err) {
//       console.log(err);
//     });
// });

// This will not work as because this is older version
// app.get("/", function(req, res) {

//   Item.find({}, function(err, foundItems){
        
//     res.render("list", {listTitle: "Today", newListItems: foundItems});
//   }) ;

// });
