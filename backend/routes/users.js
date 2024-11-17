import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";

const router = express.Router();~

//#2 - Lista de users com paginação
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (page < 1 || limit < 1) {
      return res.status(400).send({ error: "Page and limit must be positive numbers" });
    }

    const skip = (page - 1) * limit;

    const results = await db.collection('users')
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    const numberOfUsers = await db.collection('users').countDocuments();
    const numberOfPages = Math.ceil(numberOfUsers / limit);

    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < numberOfPages ? page + 1 : null;

    const paging = [
      {
        currentPage: page,
        previewsPage: previousPage,
        nextPage: nextPage,
        itensPerPage: limit,
        numberOfPages: numberOfPages,
        numberOfUsers: numberOfUsers,
      }
    ]

    res.status(200).send({
      "Paging": paging,
      "Users": results,
    });


  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Ocorreu um erro ao listar os users." });
  }
});

//#4 - Adicionar 1 ou vários utilizadores
router.post("/", async (req, res) => {
  try {
    // const para receber os dados dos livros
    const newUsers = req.body;

    // verifica se o newUsers tem formato de array e se também tem dados
    if (!Array.isArray(newUsers) || newUsers.length === 0) {
      return res.status(400).send({ error: "Introduza pelo o menos 1 utilizador." });
    }

    // vai buscar o "_id" do último user
    const lastUser = await db.collection('users').find().sort({ _id: -1 }).limit(1).toArray();

    let nextId;

    if (lastUser.length > 0) {
      nextId = lastUser[0]._id + 1;
    } else {
      nextId = 1;
    }

    // vai atribuir de forma sequencial o "_id" a cada utlizador dado
    const usersWithId = newUsers.map((user, index) => ({
      ...user,
      _id: nextId + index, // Garante IDs sequenciais
    }));

    const result = await db.collection('users').insertMany(usersWithId);

    if (result.insertedCount > 0) {
      res.status(201).send({ message: `${result.insertedCount} utilizador/es adicionado/s com sucesso.`, users: usersWithId });
    } else {
      res.status(500).send({ error: "Nenhum utilizador adicionado." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Ocorreu um erro ao adicionar o/s utilizador/es" });
  }
});

//#6 - Pesquisar user pelo _id. Incluir na resposta o top 3 livros por utilizadores
router.get("/:id", async (req, res) => {
  try {
    // o 10 significa valor decimal (base 10)
    const id = parseInt(req.params.id, 10);

    if (!id) {
      return res.status(400).send({ error: "ID inválido." });
    }

    // verificar se o utilizador existe
    const user = await db.collection('users').findOne({ _id: id });

    if (!user) {
      return res.status(404).send({ message: "Utilizador não encontrado." });
    }

    // verificar se o utilizador tem reviews
    if (!user.reviews || user.reviews.length === 0) {
      return res.status(404).send({ message: "Utilizador não tem reviews." });
    }

    const bookIds = user.reviews.map(review => review.book_id);
    const books = await db.collection('books').find({ _id: { $in: bookIds } }).toArray();

    if (books.length === 0) {
      return res.status(404).send({ message: "Nenhum livro encontrado com reviews do utilizador." });
    }

    const booksWithReviews = books.map(book => {
      const reviewForBook = user.reviews.find(review => review.book_id === book._id);
      return {
        ...book,
        rating: reviewForBook ? reviewForBook.rating : null // incluir a avaliação diretamente
      };
    });

    // ordenar os livros por rating
    booksWithReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const topBooks = booksWithReviews.slice(0, 3);

    // Passo 7: Retornar o usuário e seus top 3 livros
    res.status(200).send({
      user: {
        "ID do utilizador": user._id,
        "Nome": user.first_name,
        "Apelido": user.last_name
      },
      "Top 3 livros do utilizador": topBooks
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Ocorreu um erro ao buscar o utilizador com o seu top 3 de livros." });
  }
});

//#8 - Remove user pelo _id
router.delete("/:id", async (req, res) => {
  try {
  const id = req.params.id;

  if (!id) {
    return res.status(400).send({ error: "ID inválido." });
  }

  const _id = parseInt(id);
  const result = await db.collection('users').deleteOne({ _id: _id });

  // confirma se o utilizador foi apagado
  if (result.deletedCount === 0) {
    return res.status(404).send({ error: "No user found to delete" });
  }

  res.status(200).send({ success: true, message: "Utilizador apagado com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Ocorreu um erro ao apagar o utilizador" });
  }
});

//#10 - Update do user
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).send({ error: "Invalid ID provided" });
    }
    
    const _id = parseInt(id);

    const updatedUser = req.body;

    // update do user
    const result = await db.collection('users').updateOne(
      { _id: _id },
      { $set: updatedUser }
    );

    // verifica se o user foi encontrado e atualizado
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User não encontrado.' });
    }
    
    res.status(200).json({ message: 'User atualizado com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao autualizar o user.' });
  }
});

export default router;