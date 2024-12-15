import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CardGroup from "react-bootstrap/CardGroup";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";

export default function Books() {
  const [books, setBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // /books page
  const getBooks = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/books?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (Array.isArray(data.Livros)) {
        setBooks(data.Livros); // apresentar os dados dos livros
        setCurrentPage(data.Paging[0].currentPage);
        setTotalPages(data.Paging[0].numberOfPages);
      } else {
        console.error("Não foi retornado um array de livros.", data);
      }
    } catch (error) {
      console.error("Erro ao buscar os livros:", error);
    } finally {
      setLoading(false);  // Fim do carregamento
    }
  };

  useEffect(() => {
    getBooks(currentPage);
  }, [currentPage]);

  return (
    <div className="container pt-5 pb-5" style={{ textAlign: 'center' }}>
      <h2>Books Page</h2>
      <br></br>

      {/* loading message */}
      {loading && <p>Loading...</p>}

      <CardGroup>
        <Row xs={1} md={3} className="d-flex justify-content-around">
          {books.length === 0 ? (
            <p>No books found.</p>
          ) : (
            books.map((book) => (
              <div
                key={book._id}
                className="card mb-3"
                style={{ maxWidth: "200px", textAlign: "center" }}
              >
                <br></br>
                {/* fotografia do livro "clicável" */}
                <img
                  src={book.thumbnailUrl}
                  alt={book.title}
                  className="card-img-top"
                  style={{ cursor: "pointer", maxHeight: "200px", objectFit: "cover" }}
                  onClick={() => navigate(`/book/${book._id}`)}
                />

                {/* dados do livro */}
                <div className="card-body">
                  <h5 className="card-title">{book.title}</h5>
                  <p className="card-text">
                    <strong>Author:</strong> {book.authors.join(", ")}
                  </p>
                  <p className="card-text">
                    <strong>Price:</strong> {book.price.toFixed(2)}€
                  </p>
                </div>
              </div>
            ))
          )}
        </Row>
      </CardGroup>

      {/* paginação */}
      <div className="d-flex justify-content-center mt-4">
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || loading}
        >
          Anterior
        </Button>
        <span className="mx-3">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || loading}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
