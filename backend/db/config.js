import { MongoClient } from "mongodb";

 const connectionString = "";

 const client = new MongoClient(connectionString);

 let conn;
 try {
 conn = await client.connect();
 } catch(e) {
 console.error(e);
 }
 
 // Database name
 let db = conn.db("Project");
 export default db;