const DB = require("./index.js");

const db = new DB({ name: "users" }, { name: "posts" });

const john = db.users.insert({ name: "John", age: 30 });
const jane = db.users.insert({ name: "Jane", age: 25 });

db.posts.insertMany({ userId: john.id, title: "John's Post 1" }, { userId: john.id, title: "John's Post 2" });
db.posts.insert({ userId: jane.id, title: "Hello Universe, from Jane" });

db.saveSync("example.json");

const db2 = DB.loadSync("example.json");

const johnsPosts = db2.posts.getWhere(post => post.userId === john.id);
console.log(johnsPosts);