import React, { useState, useEffect } from "react";
import { Button, Form, Table, Modal, Badge, Alert } from "react-bootstrap";
import { Folder, Plus, Trash2, FileUp, Calendar, Edit } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import EditFolderModal from "./ThesisReportManagement/EditFolderModal";
import "../../css/ThesisReportManagement.css";
import Swal from "sweetalert2";
import { apiUrl } from "../../contexts/constants";
const ThesisReportManagement = () => {
  const [folders, setFolders] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(""); // Thêm state để lưu role của user

  useEffect(() => {
    // Lấy role từ token JWT hoặc local storage
    const getUserRole = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Decode JWT token để lấy role (nếu bạn lưu role trong token)
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join("")
          );
          const payload = JSON.parse(jsonPayload);
          setUserRole(payload.role);
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      }
    };

    getUserRole();
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/reportManagements/folders`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Fetch submission counts for each folder
      const foldersWithCounts = await Promise.all(
        response.data.folders.map(async (folder) => {
          try {
            const submissionsResponse = await axios.get(
              `${apiUrl}/reportManagements/folder-reports/${folder._id}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            return {
              ...folder,
              totalSubmissions: submissionsResponse.data.reports.length,
              onTimeSubmissions: submissionsResponse.data.reports.filter(
                (report) => !report.isLate
              ).length,
            };
          } catch (error) {
            return { ...folder, totalSubmissions: 0, onTimeSubmissions: 0 };
          }
        })
      );

      setFolders(foldersWithCounts);
    } catch (error) {
      showAlert("Lỗi khi tải danh sách thư mục", "danger");
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.target);
      const folderData = {
        name: formData.get("folderName"),
        description: formData.get("description"),
        deadline: formData.get("deadline"),
      };

      const response = await axios.post(
        `${apiUrl}/reportManagements/create-folder`,
        folderData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        setFolders([...folders, response.data.folder]);
        setShowCreateModal(false);
        showAlert("Tạo thư mục thành công!");
      } else {
        showAlert(response.data.message || "Lỗi khi tạo thư mục", "danger");
      }
    } catch (error) {
      console.error("Lỗi khi tạo thư mục:", error);
      showAlert(
        error.response?.data?.message || "Lỗi khi tạo thư mục",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị thông báo
  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  // Mở thư mục - Điều hướng đến trang chi tiết thư mục
  const handleOpenFolder = (folder) => {
    navigate(`/dashboardTeacher/folder/${folder._id}`, {
      state: { folderData: folder },
    });
  };

  // Filter folders based on search term
  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Xóa thư mục
  const handleDeleteFolder = async (folderId) => {
    try {
      // Hiển thị confirm dialog sử dụng SweetAlert2
      const result = await Swal.fire({
        title: "Xác nhận xóa",
        text: "Bạn có chắc chắn muốn xóa thư mục này? Hành động này không thể hoàn tác!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        focusCancel: true, // Focus vào nút hủy để tránh xóa nhầm
      });

      // Nếu user click Xóa
      if (result.isConfirmed) {
        setLoading(true);

        const response = await axios.delete(
          `${apiUrl}/reportManagements/folder/${folderId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          // Cập nhật state để remove folder đã xóa
          setFolders((prevFolders) =>
            prevFolders.filter((folder) => folder._id !== folderId)
          );

          // Hiển thị thông báo thành công
          Swal.fire({
            title: "Đã xóa!",
            text: "Thư mục đã được xóa thành công",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      }
    } catch (error) {
      console.error("Error deleting folder:", error);

      // Hiển thị thông báo lỗi
      Swal.fire({
        title: "Lỗi!",
        text: error.response?.data?.message || "Có lỗi xảy ra khi xóa thư mục",
        icon: "error",
        confirmButtonText: "Đóng",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mở modal chỉnh sửa
  const handleEditClick = (folder) => {
    setSelectedFolder(folder);
    setShowEditModal(true);
  };

  // Cập nhật thư mục
  const handleUpdateFolder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.target);
      const folderData = {
        name: formData.get("folderName"),
        description: formData.get("description"),
        deadline: formData.get("deadline"),
        status: formData.get("status"),
      };

      const response = await axios.put(
        `${apiUrl}/reportManagements/folder/${selectedFolder._id}`,
        folderData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        // Cập nhật state folders với thư mục đã được cập nhật
        setFolders(
          folders.map((f) =>
            f._id === selectedFolder._id ? response.data.folder : f
          )
        );
        setShowEditModal(false);
        showAlert("Cập nhật thư mục thành công!");
        await fetchFolders(); // Refresh danh sách
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Lỗi khi cập nhật thư mục",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid mt-4">
      {/* Alert message */}
      {alert && (
        <Alert
          variant={alert.type}
          className="position-fixed top-0 end-0 m-3"
          style={{ zIndex: 1050 }}
        >
          {alert.message}
        </Alert>
      )}
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Quản lý Báo cáo Luận văn</h2>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="me-2" size={16} />
          Tạo thư mục mới
        </Button>
      </div>
      {/* Search bar */}
      <div className="mb-4">
        <Form.Control
          type="search"
          placeholder="Tìm kiếm thư mục..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {/* Folders list */}
      <Table responsive striped bordered hover>
        <thead className="bg-light">
          <tr>
            <th>Tên thư mục</th>
            <th>Mô tả</th>
            <th style={{ width: "160px" }}>Ngày tạo</th>
            <th style={{ width: "160px" }}>Thời hạn nộp</th>
            <th>Số bài nộp</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {filteredFolders.map((folder) => (
            <tr key={folder._id}>
              <td>{folder.name}</td>
              <td>{folder.description}</td>
              <td className="date-column">
                {new Date(folder.createdAt).toLocaleString()}
              </td>
              <td className="date-column">
                <div className="d-flex align-items-center">
                  <Calendar size={16} className="me-2" />
                  {new Date(folder.deadline).toLocaleString()}
                </div>
              </td>
              <td>
                <div>
                  <Badge bg="primary" className="me-2">
                    Tổng: {folder.totalSubmissions || 0}
                  </Badge>
                  <Badge bg="success">
                    Đúng hạn: {folder.onTimeSubmissions || 0}
                  </Badge>
                </div>
              </td>
              <td>
                <Badge
                  bg={folder.status === "Đang mở" ? "success" : "secondary"}
                >
                  {folder.status}
                </Badge>
              </td>
              <td>
                <Button
                  variant="info"
                  size="sm"
                  className="me-2"
                  onClick={() => handleOpenFolder(folder)}
                >
                  <Folder className="me-1" size={16} />
                  Mở
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  className="me-2"
                  onClick={() => handleEditClick(folder)}
                >
                  <Edit size={16} className="me-1" />
                  Sửa
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteFolder(folder._id)}
                >
                  <Trash2 size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {/* Empty state */}
      {(!filteredFolders || filteredFolders.length === 0) && (
        <div className="text-center py-5">
          <FileUp size={48} className="text-muted mb-3" />
          <p className="text-muted mb-0">Chưa có thư mục nào được tạo</p>
        </div>
      )}
      {/* Create Folder Modal */}
      <Modal
        className="create-folder-modal"
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Tạo thư mục nộp báo cáo mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateFolder}>
            <Form.Group className="mb-3">
              <Form.Label>Tên thư mục</Form.Label>
              <Form.Control
                type="text"
                name="folderName"
                required
                placeholder="Nhập tên thư mục..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                rows={3}
                placeholder="Nhập mô tả thư mục..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Thời hạn nộp</Form.Label>
              <Form.Control type="datetime-local" name="deadline" required />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? "Đang tạo..." : "Tạo thư mục"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      {/*  Thêm Edit Modal */}
      <EditFolderModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        selectedFolder={selectedFolder}
        onUpdate={(updatedFolder) => {
          setFolders(
            folders.map((f) =>
              f._id === updatedFolder._id ? updatedFolder : f
            )
          );
          fetchFolders();
        }}
        showAlert={showAlert}
      />
      {/* Loading overlay */}
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
        >
          <div className="text-white text-center">
            <div className="spinner-border mb-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div>Đang xử lý...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThesisReportManagement;
