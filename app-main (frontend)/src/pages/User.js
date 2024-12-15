import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CardGroup from "react-bootstrap/CardGroup";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

export default function User() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { id } = useParams(); // id do user
  const navigate = useNavigate();

  const getUser = async () => {
    setLoading(true);
    setError(null);
    try {
      // url para invocar o método /users/:id
      const response = await fetch(`http://localhost:3000/users/${id}`);

      if (!response.ok) {
        throw new Error("Usuário não encontrado");
      }

      const data = await response.json();
      console.log("Resposta da API:", data);

      if (data.user) {
        setUser(data); // apresentar os dados do user
      } else {
        setError("Usuário não encontrado");
      }
    } catch (err) {
      setError(err.message); // mensagem de erro
    } finally {
      setLoading(false);
    }
  };

  // metódo para remover o user  
  const deleteUser = async () => {
    setLoading(true);
    try {
      // url para apagar o user
      const response = await fetch(`http://localhost:3000/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao remover o user");
      }

      alert("User removido com sucesso.");
      navigate("/"); // retorna à página home
    } catch (err) {
      setError(err.message); // mensagem de erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUser();
  }, [id]);

  return (
    <div className="container pt-5 pb-5" style={{ textAlign: "center" }}>
      <h2>User Details</h2>

      {/* loading message */}
      {loading && <p>Loading...</p>}

      {/* error message */}
      {error && <p className="text-danger">{error}</p>}

      {/* dados do user */}
      {user ? (
        <CardGroup
          style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          <Row xs={1} md={8} className="d-flex justify-content-around">
            <Col
              key={user.user["ID do utilizador"]}
              className="mb-3"
              style={{ maxWidth: "540px" }}
            >
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">
                    {user.user.Nome} {user.user.Apelido}
                  </h5>
                  <p className="card-text">
                    <small className="text-muted">
                      ID: {user.user["ID do utilizador"]}
                    </small>
                  </p>

                  <h6>Top 3 livros do utilizador:</h6>
                  {user["Top 3 livros do utilizador"].length > 0 ? (
                    <ul>
                      {user["Top 3 livros do utilizador"].map((book, index) => (
                        <li key={index}>
                          <strong>Title:</strong> {book.title} <br />
                          <strong>Authors:</strong> {book.authors.join(", ")} <br />
                          <strong>Price:</strong> ${book.price} <br />
                          <strong>Description:</strong> {book.shortDescription} <br />
                          <img
                            src={book.thumbnailUrl}
                            alt={book.title}
                            style={{ width: "100px", height: "150px", cursor: "pointer" }}
                            onClick={() => navigate(`/book/${book.id}`)} // a imagem do livro é "clicável" e direciona para a página do livro
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No top books available</p>
                  )}

                  {/* botão para apagar o user */}
                  <Button variant="danger" onClick={deleteUser}>
                    Remover Usuário
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </CardGroup>
      ) : (
        <p>User não encontrado</p>
      )}
    </div>
  );
}
