import React, { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [userId, setUserId] = useState("");
  const [bookId, setBookId] = useState("");
  const navigate = useNavigate();

  const handleShowBookModal = () => {
    setModalType("book");
    setShowModal(true);
  };

  const handleShowUserModal = () => {
    setModalType("user");
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setBookId("");
    setUserId("");
  };

  const handleSubmitBook = (e) => {
    e.preventDefault();
    if (bookId) {
      navigate(`/book/${bookId}`);
    } else {
      alert("Id do livro inválido.");
    }
    handleClose();
  };

  const handleSubmitUser = (e) => {
    e.preventDefault();
    if (userId) {
      navigate(`/user/${userId}`);
    } else {
      alert("Id do user inválido.");
    }
    handleClose();
  };

  return (
    <React.Fragment>
      <div className="jumbotron pt-5 pb-5">
        <div className="container text-left">
          <h1 className="display-4">ADAD-Project, front-end application!</h1>
          <p className="lead">ADAD-Project-Group9</p>
          <hr className="my-4" />
          <p className="lead">
            {/* botões para abrir os modals */}
            <Button variant="primary" className="ms-1" onClick={handleShowBookModal}>
              Book &rarr;
            </Button>
            <Button variant="primary" className="ms-1" onClick={handleShowUserModal}>
              User &rarr;
            </Button>
            <Button variant="primary" className="ms-1" onClick={() => navigate("/books")}>
              Books &rarr;
            </Button>
            <Button variant="primary" className="ms-1" onClick={() => navigate("/users")}>
              Users &rarr;
            </Button>
          </p>
        </div>
      </div>

      <div className="container mt-5 mb-5">
        <div className="row mb-5">
          <div className="col-md-8">
            <h2>Members</h2>
            <ul>
              <li>98616 - Bernardo Assunção - METI-PL-A1 - Bernardo_Assuncao@iscte-iul.pt</li>
              <li>98931 - Filipe Vasconcelos - METI-PL-A1 - Filipe_Vasconcelos@iscte-iul.pt</li>
              <li>98624 - Gonçalo Lobato - METI-PL-A1 - Goncalo_Lobato@iscte-iul.pt</li>
              <li>99435 - Nuno Teixeira - METI-PL-A1 - Nuno_Oliveira_Teixiera@iscte-iul.pt</li>
              <li>99227 - Tomás Catarino - METI-A1 - Tomas_Catarino@iscte-iul.pt</li>
            </ul>
          </div>
        </div>
      </div>

      {/* modal para livro ou user */}
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === "book" ? "Informe o ID do Livro" : "Informe o ID do Usuário"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={modalType === "book" ? handleSubmitBook : handleSubmitUser}>
            <Form.Group controlId={modalType === "book" ? "bookId" : "userId"}>
              <Form.Label>
                {modalType === "book" ? "ID do Livro" : "ID do Usuário"}
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o ID"
                value={modalType === "book" ? bookId : userId}
                onChange={(e) =>
                  modalType === "book"
                    ? setBookId(e.target.value)
                    : setUserId(e.target.value)
                }
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="mt-3">
              Buscar
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
}
