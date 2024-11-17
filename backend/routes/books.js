import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";

const router = express.Router();

//#1 - Lista de livros com paginação
router.get("/", async (req, res) => {
  try {
    // obter os valores dados no endpoint, caso não seja dado nenhum é definido o padrão
    const page = parseInt(req.query.page) || 1; // padrão é 1
    const limit = parseInt(req.query.limit) || 20; // padrão é 20

    // verificar se o número da página e o limit dados são validos
    if (page < 1 || limit < 1) {
      return res.status(400).send({ error: "O número da página e o limite devem ser positivos" });
    }

    // calcula o número de livros a dar "skip"
    const skip = (page - 1) * limit;

    // consulta a coleção "books" com paginação
    const results = await db.collection('books')
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    // obter o número total de livros e de páginas
    const numberOfBooks = await db.collection('books').countDocuments();
    const numberOfPages = Math.max(1, Math.ceil((numberOfBooks || 0) / limit));
    if (numberOfPages < 1) numberOfPages = 1;

    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < numberOfPages ? page + 1 : null;

    const paging = [
      {
        currentPage: page,
        previewsPage: previousPage,
        nextPage: nextPage,
        itensPerPage: limit,
        numberOfPages: numberOfPages,
        numberOfBooks: numberOfBooks,
      }
    ]

    // retorna a reposta com as diferentes informações...
    res.status(200).send({
      "Paging": paging,
      "Livros": results,
    });

  } catch (error) {
    console.error("Erro ao buscar livros com paginação: ", error);
    res.status(500).send({ error: "Ocorreu um erro ao listar os livros." });
  }
});

//#3 - Adicionar 1 ou vários livros
router.post("/", async (req, res) => {
  try {
    // const para receber os dados dos livros
    const newBooks = req.body;

    // verifica se o newBooks tem formato array e se tem dados
    if (!Array.isArray(newBooks) || newBooks.length === 0) {
      return res.status(400).send({ error: "Introduza pelo o menos 1 livro." });
    }

    // vai buscar o "_id" do último livro
    const lastBook = await db.collection('books').find().sort({ _id: -1 }).limit(1).toArray();

    let nextId;

    if (lastBook.length > 0) {
      nextId = lastBook[0]._id + 1;
    } else {
      nextId = 1;
    }

    // vai atribuir de forma sequencial o "_id" a cada livro dado
    const booksWithId = newBooks.map((book, index) => ({
      ...book,
      _id: nextId + index, // Garante IDs sequenciais
    }));

    const result = await db.collection('books').insertMany(booksWithId);

    if (result.insertedCount > 0) {
      res.status(201).send({ message: `${result.insertedCount} livro/s adicionado/s com sucesso.`, books: booksWithId });
    } else {
      res.status(500).send({ error: "Nenhum livro adicionado." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Ocorreu um erro ao adicionar o/s livro/s." });
  }
});

//#7 - Remover livro pelo _id
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id; 

    if (!id) {
      return res.status(400).send({ error: "ID inválido." });
    }

    const _id = parseInt(id);
    const result = await db.collection('books').deleteOne({ _id: _id });

    // confirma se foi apagado algum livro
    if (result.deletedCount === 0) {
      return res.status(404).send({ error: "Nenhum livro foi apagado com o id fornecido." });
    }

    res.status(200).send({ success: true, message: "Livro apagado com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Ocorreu um erro ao apagar o livro." });
  }
});

//#9 - Update livro
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).send({ error: "ID inválido." });
    }

    const _id = parseInt(id);
    
    const updatedBook = req.body; 
    
    // update ao livro
    const result = await db.collection('books').updateOne(
      { _id: _id },
      { $set: updatedBook }
    );

    // verifica se o livro foi encontrado e atualizado
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Livro não encontrado.' });
    }

    res.status(200).json({ message: 'Livro atualizado com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao atualizar o livro.' });
  }
});

//#11 - Lista de livros com maior score (pela média), por ordem descendente. Mostrar na resposta toda a informação do livro
router.get("/top/:limit", async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (page < 1 || limit < 1) {
      return res.status(400).send({ error: "O número da página e o limite devem ser positivos" });
    }

    const pipeline = [
      { $unwind: "$reviews" },

      // calcular a média dos scores
      {
        $group: {
          _id: "$reviews.book_id",
          averageScore: { $avg: "$reviews.score" }
        }
      },

      // lookup para buscar informações do livro
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "bookInfo"
        }
      },

      { $unwind: "$bookInfo" },

      // ordenar pelo o score
      { $sort: { averageScore: -1 } },

      // limitar pelo o :limit dado
      { $limit: limit },

      // apresentar cada livro com a informação dele e a média
      {
        $project: {
          _id: "$bookInfo._id",
          title: "$bookInfo.title",
          isbn: "$bookInfo.isbn",
          pageCount: "$bookInfo.pageCount",
          publishedDate: "$bookInfo.publishedDate",
          thumbnailUrl: "$bookInfo.thumbnailUrl",
          shortDescription: "$bookInfo.shortDescription",
          longDescription: "$bookInfo.longDescription",
          status: "$bookInfo.status",
          authors: "$bookInfo.authors",
          categories: "$bookInfo.categories",
          averageScore: 1
        }
      }
    ];

    const topBooks = await db.collection("users").aggregate(pipeline).toArray();

    res.status(200).send(topBooks);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Ocorreu um erro ao buscar a lista de livros por score." });
  }
});

//#13 - Lista de livros com mais 5 estrelas. Mostrar toda a informação do livro e o número de reviews igual a 5
router.get("/star", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (page < 1 || limit < 1) {
      return res.status(400).send({ error: "O número da página e o limite devem ser positivos" });
    }

    const skip = (page - 1) * limit;

    const pipeline = [
      { $unwind: "$reviews" },
      { $match: { "reviews.score": 5 } },
      {
        $group: {
          _id: "$reviews.book_id",
          fiveStarReviews: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "bookInfo"
        }
      },
      { $unwind: "$bookInfo" },

      {
        $project: {
          _id: "$bookInfo._id",
          title: "$bookInfo.title",
          isbn: "$bookInfo.isbn",
          pageCount: "$bookInfo.pageCount",
          publishedDate: "$bookInfo.publishedDate",
          thumbnailUrl: "$bookInfo.thumbnailUrl",
          shortDescription: "$bookInfo.shortDescription",
          longDescription: "$bookInfo.longDescription",
          status: "$bookInfo.status",
          authors: "$bookInfo.authors",
          categories: "$bookInfo.categories",
          fiveStarReviews: 1
        }
      },
      { $sort: { fiveStarReviews: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const starBooks = await db.collection("users").aggregate(pipeline).toArray();

    const numberOfBooks = starBooks.length;
    const numberOfPages = Math.max(1, Math.ceil(numberOfBooks / limit));

    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < numberOfPages ? page + 1 : null;

    const paging = [
      {
        currentPage: page,
        previewsPage: previousPage,
        nextPage: nextPage,
        itensPerPage: limit,
        numberOfPages: numberOfPages,
        numberOfBooks: numberOfBooks,
      }
    ];

    res.status(200).send({
      "Paging": paging,
      "Livros": starBooks,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Ocorreu um erro ao ir buscar os livros com reviews de 5 estrelas." });
  }
});

//#15 - Lista de livros que têm comentários. Ordenado pelo número total de comentários
router.get('/comments', async (req, res) => {
  try {
      const commentsCollection = db.collection("comments");

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const skip = (page - 1) * limit;

      const booksWithComments = await commentsCollection.aggregate([
          {
              $group: {
                  _id: "$book_id",
                  numberOfComments: { $sum: 1 } // count de comentários em cada livro
              }
          },
          {
              $sort: { numberOfComments: -1 } // ordena os livros por número de comentários
          },
          {
              $lookup: {
                  from: "books",
                  localField: "_id", // campo para fazer o join (book_id)
                  foreignField: "_id", // campo em "books" para fazer o join
                  as: "book_details"
              }
          },
          {
              $unwind: "$book_details"
          },
          {
              $project: {
                  title: "$book_details.title",
                  isbn: "$book_details.isbn",
                  pageCount: "$book_details.pageCount",
                  publishedDate: "$book_details.publishedDate",
                  thumbnailUrl: "$book_details.thumbnailUrl",
                  shortDescription: "$book_details.shortDescription",
                  longDescription: "$book_details.longDescription",
                  status: "$book_details.status",
                  authors: "$book_details.authors",
                  categories: "$book_details.categories",
                  numberOfComments: 1
              }
          },
          {
              $skip: skip 
          },
          {
              $limit: limit
          }
      ]).toArray(); // converte em array

      const numberOfBooksWithComments = await commentsCollection.aggregate([
          {
              $group: {
                  _id: "$book_id",
                  totalComments: { $sum: 1 }
              }
          },
          {
              $count: "total" // total de livros com comentários
          }
      ]).toArray();

      const numberOfBooks = numberOfBooksWithComments.length > 0 ? numberOfBooksWithComments[0].total : 0;
      const numberOfPages = Math.max(1, Math.ceil((numberOfBooks || 0) / limit));

      const previousPage = page > 1 ? page - 1 : null;
      const nextPage = page < numberOfPages ? page + 1 : null;

      const paging = [
        {
          currentPage: page,
          previewsPage: previousPage,
          nextPage: nextPage,
          itensPerPage: limit,
          numberOfPages: numberOfPages,
          numberOfBooks: numberOfBooks,
        }
      ]

      res.status(200).send({
        "Paging": paging,
        "Livros": booksWithComments,
      });

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Ocorreu um erro ao ir buscar a lista de livros com comentários" });
  }
});

//#16 - Número total de reviews por "job". Resultado deverá apresentar apenas o "job" e número de reviews
router.get('/job', async (req, res) => {
  try {
      const usersCollection = db.collection("users");

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      if (page < 1 || limit < 1) {
      return res.status(400).send({ error: "O número da página e o limite devem ser positivos" });
      }

      const skip = (page - 1) * limit;

      const jobReviewsCount = await usersCollection.aggregate([
          {
              $unwind: "$reviews"
          },
          {
              $group: {
                  _id: "$job",
                  numberOfReviews: { $sum: 1 } // count de reviews por "job"
              }
          },
          {
              $project: {
                  _id: 0, 
                  job: "$_id", // renomeia "_id" para "job"
                  numberOfReviews: 1 
              }
          },
          {
              $sort: { numberOfReviews: -1 } // ordenar de forma descrescente
          },
          {
              $skip: skip
          },
          {
              $limit: limit
          }
      ]).toArray();

      const numberOfJobReviews = await usersCollection.aggregate([
          {
              $unwind: "$reviews"
          },
          {
              $group: {
                  _id: "$job",
                  numberOfReviews: { $sum: 1 }
              }
          },
          {
              $count: "total" // Conta o número total de "jobs" com reviews
          }
      ]).toArray();

      const totalCount = numberOfJobReviews.length > 0 ? numberOfJobReviews[0].total : 0;
      const numberOfPages = Math.max(1, Math.ceil((totalCount || 0) / limit)); // Calcula o número de páginas

      const previousPage = page > 1 ? page - 1 : null;
      const nextPage = page < numberOfPages ? page + 1 : null;

      const paging = [
        {
          currentPage: page,
          previewsPage: previousPage,
          nextPage: nextPage,
          itensPerPage: limit,
          numberOfPages: numberOfPages,
          totalOfItens: totalCount,
        }
      ]

       res.status(200).send({
         "Paging": paging,
         "Lista": jobReviewsCount // lista de jobs com o número total de reviews
       });

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Ocorreu um erro ao ir buscar a lista de jobs com reviews" });
  }
});

//#12 - Lista de livros ordenado pelo número total de reviews :order - "asc" or "desc"
router.get('/ratings/:order', async (req, res) => {
  try {
      const booksCollection = db.collection("books");

      const { order } = req.params;

      // validar se foi fornecido "asc" ou "desc"
      if (order !== 'asc' && order !== 'desc') {
          return res.status(400).json({ error: "Campo inválido, :order tem que ser asc ou desc." });
      }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (page < 1 || limit < 1) {
      return res.status(400).send({ error: "O número da página e o limite devem ser positivos" });
    }

    const skip = (page - 1) * limit;

      // determinar qual ordenação
      const sortOrder = order === 'asc' ? 1 : -1;

      const booksWithReviewCount = await booksCollection.aggregate([
          {
              $lookup: {
                  from: 'comments', 
                  localField: '_id', // _id da coleção de livros
                  foreignField: 'book_id', // book_id da coleção de comentários
                  as: 'reviews'
              }
          },
          {
              $addFields: {
                  numberOfReviews: { $size: "$reviews" } // número de reviews por cada livro
              }
          },
          {
              $project: {
                  title: 1, 
                  numberOfReviews: 1 
              }
          },
          {
              $sort: { numberOfReviews: sortOrder } // ordena pelo o número de reviews
          },
          {
              $skip: skip,
          },
          {
              $limit: parseInt(limit)
          }
      ]).toArray();

      const totalBooks = await booksCollection.aggregate([
          {
              $lookup: {
                  from: 'comments',
                  localField: '_id',
                  foreignField: 'book_id',
                  as: 'reviews'
              }
          },
          {
              $addFields: {
                numberOfReviews: { $size: "$reviews" }
              }
          },
          {
              $project: {
                  numberOfReviews: 1
              }
          },
          {
              $count: "total"
          }
      ]).toArray();

      const numberOfBooks = totalBooks[0]?.total || 0;
      const numberOfPages = Math.max(1, Math.ceil((numberOfBooks || 0) / limit));

      const previousPage = page > 1 ? page - 1 : null;
      const nextPage = page < numberOfPages ? page + 1 : null;
  
      const paging = [
        {
          currentPage: page,
          previewsPage: previousPage,
          nextPage: nextPage,
          itensPerPage: limit,
          numberOfPages: numberOfPages,
          numberOfBooks: numberOfBooks,
        }
      ]

      res.status(200).send({
        "Paging": paging,
        "Livros": booksWithReviewCount
      });

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Ocorreu um erro ao ir buscar a lista de livros ordenado pelo número total de reviews " });
  }
});

//#5 - Pesquisar livro pelo _id - Resposta deverá incluir toda a informação do livro, o average score e a lista de todos os comentários
router.get('/:id', async (req, res) => {
  try {
    const booksCollection = db.collection("books");
    const commentsCollection = db.collection("comments");
    const usersCollection = db.collection("users");

    const { id } = req.params;

    const bookId = parseInt(id);
    if (!id) {
      return res.status(400).send({ error: "ID inválido." });
    }

    const book = await booksCollection.findOne({ _id: bookId });

    if (!book) {
      return res.status(404).json({ error: "Livro não encontrado." });
    }

    const comments = await commentsCollection.find({ book_id: bookId }).toArray();

    const userIds = [...new Set(comments.map(comment => comment.user_id))];

    const users = await usersCollection.find({ _id: { $in: userIds } }).toArray();
    
    const usersMap = users.reduce((acc, user) => {
      acc[user._id] = user;
      return acc;
    }, {});

    const detailedComments = comments.map(comment => {
      const user = usersMap[comment.user_id];
      return {
        comment,
        userFirstName: user.first_name,
        userLastName: user.last_name,
        userJob: user.job,
        userYearOfBirth: user.year_of_birth
      };
    });

    const usersForReviews = await usersCollection.find({ "reviews.book_id": bookId }).toArray();

    // calcular a média
    let averageScore = 0;
    const totalReviews = usersForReviews.reduce((acc, user) => {
      const bookReviews = user.reviews.filter(review => review.book_id === bookId);
      return acc + bookReviews.length;
    }, 0);

    if (totalReviews > 0) {
      const sumOfScores = usersForReviews.reduce((acc, user) => {
        const bookReviews = user.reviews.filter(review => review.book_id === bookId);
        return acc + bookReviews.reduce((sum, review) => sum + review.score, 0);
      }, 0);
      averageScore = sumOfScores / totalReviews;
    }

     res.status(200).send({
       book,
       averageScore,
       comments: detailedComments
     });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ocorreu um erro ao buscar o livro." });
  }
});

//#14 - Lista de livros avaliados no ano {year}
router.get('/year/:year', async (req, res) => {
  const { year } = req.params;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  if (page < 1 || limit < 1) {
    return res.status(400).send({ error: "O número da página e o limite devem ser positivos" });
  }

  const skip = (page - 1) * limit;

  // verificar se o parâmetro 'year' é válido
  if (!/^\d{4}$/.test(year)) {
    return res.status(400).json({ error: 'Ano inválido.' });
  }

  try {
    const booksCollection = db.collection('books');

    // definir o intervalo de datas para o ano
    const query = {
      'publishedDate': {
        $gte: new Date(`${year}-01-01`), // Início do ano
        $lt: new Date(`${parseInt(year) + 1}-01-01`), // Início do próximo ano
      }
    };

    const numberOfBooks = await booksCollection.countDocuments(query);
    const numberOfPages = Math.max(1, Math.ceil((numberOfBooks || 0) / limit));

    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < numberOfPages ? page + 1 : null;

    const paging = [
      {
        currentPage: page,
        previewsPage: previousPage,
        nextPage: nextPage,
        itensPerPage: limit,
        numberOfPages: numberOfPages,
        numberOfBooks: numberOfBooks,
      }
    ]

    const books = await booksCollection.find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    res.status(200).send({
      "Paging": paging,
      "Livros": books
    });

  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    res.status(500).json({ error: 'Erro ao buscar livros.' });
  }
});

//#17 - Lista de livros filtra por preço, categoria e/ou autor.
router.get("/filter/by", async (req, res) => {
  try {
    const { category, author, price } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (page < 1 || limit < 1) {
      return res.status(400).send({ error: "O número da página e o limite devem ser positivos" });
    }

    const skip = (page - 1) * limit;

    const filters = {};

    // filtrar por categoria
    if (category) filters.categories = { $in: [category] };

    // filtrar por autor
    if (author) filters.authors = { $in: [author] };

    // filtrar por preço
    const sortOptions = {};
    if (price) {
      sortOptions.price = price === "asc" ? 1 : -1; // verifica por que ordem vai ordenar
    }

    const books = await db.collection("books")
      .find(filters)
      .sort(sortOptions) // Aplicar ordenação, se houver
      .toArray();

    const numberOfBooks = await db.collection("books").countDocuments(filters);
    
    const numberOfPages = Math.max(1, Math.ceil((numberOfBooks || 0) / limit));

    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < numberOfPages ? page + 1 : null;


    const paging = [
      {
        currentPage: page,
        previewsPage: previousPage,
        nextPage: nextPage,
        itensPerPage: limit,
        numberOfPages: numberOfPages,
        numberOfBooks: numberOfBooks,
      }
    ]

    res.status(200).send({
      "Paging": paging,
      "Livros": books,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Ocorreu um erro ao buscar os livros por filtragem." });
  }
});

export default router;