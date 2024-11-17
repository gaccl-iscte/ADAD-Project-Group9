import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { book_id, comment, user_id } = req.body;

    if (!book_id || !comment || !user_id) {
      return res.status(400).send({ error: "É necessário o book_id, o user_id e o comentário" });
    }

    const lastComment = await db.collection('comments')
      .find()
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    const nextId = (lastComment.length > 0 ? lastComment[0]._id : 0) + 1;


    const newComment = {
      "_id": nextId,
      "movie_id": book_id,
      "user_id": user_id,
      "comment": comment,
      "date": new Date()
    };

    await db.collection('comments').insertOne(newComment);

    res.status(201).json(newComment);

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Ocorreu um erro ao adicionar o comentário" });
  }
});

  

//#19 - Remove comment by _id
router.delete("/:id", async (req, res) => {
    try {    
    const id = req.params.id;

    if (!id) {
      return res.status(400).send({ error: "ID inválido." });
    }
  
    const _id = parseInt(id);
    const result = await db.collection('comments').deleteOne({ _id: _id });
  
    // verificar se algum comentário foi apagado
    if (result.deletedCount === 0) {
      return res.status(404).send({ error: "Nenhum comentário foi apagado com o id fornecido." });
    }
  
    res.status(200).send({ success: true, message: "Comentário apagado com sucesso." });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Ocorreu um erro ao apagar o comentário" });
    }
  });

export default router;
