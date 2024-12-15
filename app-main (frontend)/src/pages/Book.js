import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CardGroup from 'react-bootstrap/CardGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

export default function Book() {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { id } = useParams();  // id do livro
  const navigate = useNavigate();

  // book/:id page
  const getBook = async () => {
    setLoading(true);
    setError(null);
    try {
      // url para invocar o método /book/:id
      const response = await fetch(`http://localhost:3000/books/${id}`);

      if (!response.ok) {
        throw new Error('Livro não encontrado');
      }

      const data = await response.json();
      console.log("Resposta da API:", data);

      if (data.book) {
        setBook(data);  // apresentar os dados do livro
      } else {
        setError('Livro não encontrado');
      }
    } catch (err) {
      setError(err.message);  // mensagem de erro
    } finally {
      setLoading(false);
    }
  };

  // metódo para remover o livro
  const deleteBook = async () => {
    setLoading(true);
    try {
      // url para apagar o livro
      const response = await fetch(`http://localhost:3000/books/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao remover o livro');
      }

      alert('Livro removido com sucesso.');
      navigate('/');  // retorna à página home
    } catch (err) {
      setError(err.message);  // mensagem de erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBook();
  }, [id]);

  return (
    <div className="container pt-5 pb-5" style={{ textAlign: 'center' }}>
      <h2>Detalhes do Livro</h2>

      {/* loading message */}
      {loading && <p>Carregando...</p>}

      {/* error message */}
      {error && <p className="text-danger">{error}</p>}

      {/* dados do livro */}
      {book ? (
        <CardGroup style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Row xs={1} md={8} className="d-flex justify-content-around">
            <Col key={book.book._id} className="mb-3" style={{ maxWidth: "540px" }}>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{book.book.title}</h5>
                  <p className="card-text">
                    <small className="text-muted">ID: {book.book._id}</small>
                  </p>

                  {/* imagem do livro */}
                  <img
                    src={book.book.thumbnailUrl}
                    alt={book.book.title}
                    style={{ width: "200px", height: "300px", marginBottom: "20px" }}
                  />

                  <h6>Authors:</h6>
                  <p>{book.book.authors.join(", ")}</p>

                  <h6>Price:</h6>
                  <p>{book.book.price}€</p>

                  <h6>Description:</h6>
                  <p>{book.book.shortDescription}</p>

                  <h6>Average Rating:</h6>
                  <p>{book.averageScore}</p>

                  <h6>Comentários:</h6>
                  {book.comments.length > 0 ? (
                    <ul>
                      {book.comments.map((comment, index) => (
                        <li key={index}>
                          <strong>{comment.userFirstName} {comment.userLastName}</strong> ({comment.userJob}, born {comment.userYearOfBirth}):<br />
                          {comment.comment.text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Não há comentários disponíveis.</p>
                  )}

                  {/* botão para apagar o livro */}
                  <Button variant="danger" onClick={deleteBook}>Remover Livro</Button>
                </div>
              </div>
            </Col>
          </Row>
        </CardGroup>
      ) : (
        <p>Livro não encontrado</p>
      )}
    </div>
  );
}
