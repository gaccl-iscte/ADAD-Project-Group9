import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CardGroup from "react-bootstrap/CardGroup";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // /users page
  const getUsers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/users?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (Array.isArray(data.Users)) {
        setUsers(data.Users);  // apresentar os dados dos users
        setCurrentPage(data.Paging[0].currentPage);
        setTotalPages(data.Paging[0].numberOfPages);
      } else {
        console.error("Não foi retornado um array de livros.", data);
      }
    } catch (error) {
      console.error("Erro ao buscar os users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers(currentPage);
  }, [currentPage]);

  return (
    <div className="container pt-5 pb-5" style={{ textAlign: 'center' }}>
      <h2>Users Page</h2>

      {/* loading message */}
      {loading && <p>Loading...</p>}

      <CardGroup>
        <Row xs={1} md={3} className="d-flex justify-content-around">
          {users.length === 0 ? (
            <p>Nenhum usuário encontrado.</p>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                className="card mb-3"
                style={{ maxWidth: "540px" }}
              >
                {/* dados do user */}
                <div className="col-md-8">
                  <div className="card-body">
                    <h5 className="card-title">Name: {user.first_name} {user.last_name}</h5>
                    <p className="card-text">
                      <small className="text-muted">ID: {user._id}</small>
                    </p>
                    <p className="card-text">
                      <strong>Job:</strong> {user.job}
                    </p>
                    <p className="card-text">
                      <strong>Year of Birth:</strong> {user.year_of_birth}
                    </p>
                    {/* botão para ir para os detalhes do user */}
                    <Button
                      variant="primary"
                      onClick={() => {
                        console.log(`A direcionar para o user com o ID: ${user._id}`);
                        navigate(`/user/${user._id}`);
                      }}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
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
