import express from 'express';
import books from "./routes/books.js";
import users from "./routes/users.js";
import comments from "./routes/comments.js";
import livrarias from "./routes/livrarias.js";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/books", books);

app.use("/users", users);

app.use("/comments", comments);

app.use("/livrarias", livrarias);

app.listen(port, () => {
console.log(`backend listening on port ${port}`);
})
