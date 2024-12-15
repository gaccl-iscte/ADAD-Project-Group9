import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";

const router = express.Router();

//#20.1 - Adicionar livros da lista (books.json) a cada livraria.
router.post('/:id/books', async (req, res) => {
  const { id } = req.params;
  const books = req.body; // ficheiro .json

  try {
    // verificar se a livraria existe
    const livraria = await db.collection('livrarias').findOne({ _id: parseInt(id) });
    if (!livraria) {
      return res.status(404).json({ error: 'Livraria não foi encontrada.' });
    }

    // buscara os IDs de cada livro ao ficheiro .json
    const booksIDs = books.map(books => books._id);

    // Adiciona os IDs dos livros à livraria, sem duplicação
    await db.collection('livrarias').updateOne(
      { _id: parseInt(id) },
      { $addToSet: { books: { $each: booksIDs } } }
    );

    res.status(200).json({ message: 'IDs dos livros adicionados à livraria.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao adicionar IDs dos livros à livraria.' });
  }
});

// #20.2 - Consultar livros numa livraria
router.get('/:id/books', async (req, res) => {
  const { id } = req.params;

  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (page < 1 || limit < 1) {
      return res.status(400).send({ error: "O número da página e o limite devem ser positivos" });
    }

    const livraria = await db.collection('livrarias').findOne({ _id: parseInt(id) });
    if (!livraria) {
      return res.status(404).json({ error: 'Livraria não foi encontrada.' });
    }

    // se não tiver nada retorna um array vazio
    if (!livraria.books || livraria.books.length === 0) {
      return res.json({ books: [] });
    }

    // ir buscar a informação de cada livro à collection books
    const books = await db.collection('books').find({ _id: { $in: livraria.books } }).toArray();

    const numberOfBooks = books.length;
    const numberOfPages = Math.max(1, Math.ceil((numberOfBooks || 0) / limit));

    if (page > numberOfPages) {
      return res.status(400).send({ error: "Página não existe" });
    }

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
      "Livros": books
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao consultar os livros da livraria.' });
  }
});

//#20.3 - Lista de livrarias perto de uma localização
router.get('/near', async (req, res) => {
  const { lat, lon, radius = 1000 } = req.query; // raio padrão: 1000 metros

  try {
      const livrarias = await db.collection('livrarias').find({
          geometry: {
              $near: {
                  $geometry: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] },
                  $maxDistance: parseInt(radius) // raio em metros
              }
          }
      }).toArray();


    res.status(200).send({
      livrarias
    });

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar livrarias próximas.' });
  }
});


//#20.4 - Lista de livrarias perto do caminho de uma rota
router.post('/route', async (req, res) => {
  const { coordenadas } = req.body;

  // verificar se dão dadas coordenadas suficientes para construir um poligono para fazer a área de procura
  if (!coordenadas || coordenadas.length < 3) {
      return res.status(400).json({ error: "É necessário fornecer pelo menos 3 pontos para definir um polígono." });
  }

  try {
      const polygon = {
          type: "Polygon",
          coordinates: [coordenadas]
      };

      const livrarias = await db.collection('livrarias').find({
          "geometry.type": "Point",
          geometry: {
              $geoWithin: {
                  $geometry: polygon
              }
          }
      }).toArray();

      if (livrarias.length > 0) {
          res.status(200).send({
            mensagem: "foram encontradas as seguintes livrarias dentro da rota",
              livrarias: livrarias
          });

      } else {
          res.status(200).send({
            mensagem: "Não foram encontradas livrarias dentro da rota."
          });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Ocorreu um erro ao tentar buscar as livrarias dentro do polígono." });
  }
});


//#20.5 - Número de livrarias perto de uma localização
router.get('/count-near', async (req, res) => {
  const { lat, lon, radius = 1000 } = req.query;

  try {
    const livrarias = await db.collection('livrarias').find({
      geometry: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      }
    }).toArray();

    // resumidamente é pegar na #20.3 e a contar o número de livrarias
    const count = livrarias.length;

    res.status(200).send({
      count
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar livrarias próximas.' });
  }
 });  

//#20.6 - Verificar se um determinado user (Ponto) se encontra dentro da feira do livro
router.get('/verify-feira', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
      return res.status(400).json({ error: "É necessário a latitude e a longitude do ponto." });
  }

  try {  
      const point = [parseFloat(lon), parseFloat(lat)];

      // buscar a feira do livro à collection livrarias
      const feira = await db.collection('livrarias').findOne({
          name: "Feira do Livro",
          "geometry.type": "Polygon",
          geometry: {
              $geoIntersects: {
                  $geometry: {
                      type: "Point",
                      coordinates: point
                  }
              }
          }
      });

      if (feira) {
          res.status(200).send({
            mensagem: "O ponto está dentro da área da Feira do Livro."
          });
      } else {
          res.status(200).send({
            mensagem: "O ponto está fora da área da Feira do Livro."
          });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Ocorreu um erro ao verificar se o ponto se encontra dentro da feira do livro." });
  }
});

export default router;