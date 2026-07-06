import React, { useEffect, useState, useMemo } from "react";
import { useToast } from "../../components/system/ToastProvider";
import { getFiles, createFileRecord, deleteFileRecord, uploadFileRecord } from "../../api/fileManagerApi";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export default function FileManagerPage() {
  const { showSuccess, showError } = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderHistory, setFolderHistory] = useState([]);

  // Modal / Form states
  const [folderName, setFolderName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await getFiles(currentFolderId, searchQuery);
      setFiles(data);
    } catch (e) {
      showError("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [currentFolderId, searchQuery]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) {
      showError("Folder name is required");
      return;
    }
    try {
      const payload = {
        name: folderName.trim(),
        isDirectory: true,
        parentId: currentFolderId,
      };
      const created = await createFileRecord(payload);
      if (created) {
        setFiles((prev) => [...prev, created]);
        setFolderName("");
        showSuccess("Folder created");
        const modalEl = document.getElementById("add_folder");
        if (modalEl) {
          const closeBtn = modalEl.querySelector('[data-bs-dismiss="modal"]');
          if (closeBtn) closeBtn.click();
        }
      }
    } catch (e) {
      showError("Failed to create folder");
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showError("Please select a file to upload");
      return;
    }
    setUploading(true);
    try {
      const created = await uploadFileRecord(selectedFile, currentFolderId);
      if (created) {
        setFiles((prev) => [...prev, created]);
        setSelectedFile(null);
        showSuccess("File uploaded successfully");
        const modalEl = document.getElementById("upload_file");
        if (modalEl) {
          const closeBtn = modalEl.querySelector('[data-bs-dismiss="modal"]');
          if (closeBtn) closeBtn.click();
        }
      }
    } catch (e) {
      showError("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (id) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      await deleteFileRecord(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      showSuccess("Item deleted");
    } catch (e) {
      showError("Failed to delete item");
    }
  };

  const handleFolderClick = (folder) => {
    setFolderHistory((prev) => [...prev, { id: currentFolderId, name: folder.name }]);
    setCurrentFolderId(folder.id);
  };

  const handleBreadcrumbClick = (folderId, index) => {
    setFolderHistory((prev) => prev.slice(0, index));
    setCurrentFolderId(folderId);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const storageStats = useMemo(() => {
    // Basic calculation of total size in mock storage
    const usedBytes = files.filter(f => !f.isDirectory).reduce((acc, f) => acc + (f.size || 0), 0);
    const limitBytes = 10 * 1024 * 1024 * 1024; // 10 GB limit
    const percent = Math.min(((usedBytes / limitBytes) * 100), 100);
    return {
      used: formatBytes(usedBytes),
      limit: formatBytes(limitBytes),
      percent: percent.toFixed(1),
    };
  }, [files]);

  return (
    <div className="content">
      {/* Page Header */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>File Manager</h2>
            <nav className="mb-0">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <a href="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    <i className="ti ti-smart-home"></i>
                  </a>
                </li>
                <li className="breadcrumb-item" style={{ color: "#64748b" }}>Application</li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>File Manager</li>
              </ol>
            </nav>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="ti ti-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0 animate-focus"
                style={{ borderRadius: "0 8px 8px 0", height: 42, maxWidth: 220 }}
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              data-bs-toggle="modal"
              data-bs-target="#add_folder"
              style={{ fontWeight: "600", padding: "10px 20px", borderRadius: "10px", height: 42 }}
            >
              <i className="ti ti-folder-plus" style={{ fontSize: "1.1rem" }}></i>
              New Folder
            </button>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              data-bs-toggle="modal"
              data-bs-target="#upload_file"
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px", height: 42 }}
            >
              <i className="ti ti-upload" style={{ fontSize: "1.1rem" }}></i>
              Upload File
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Storage Stats Sidebar */}
        <div className="col-lg-3 mb-4">
          <div className="card border-0 shadow-sm p-4 text-center bg-white" style={{ borderRadius: 12 }}>
            <span className="avatar avatar-lg rounded-circle bg-primary-transparent text-primary mb-3 mx-auto" style={{ width: "60px", height: "60px" }}>
              <i className="ti ti-database" style={{ fontSize: "2rem" }}></i>
            </span>
            <h5 className="fw-bold text-dark">Storage Status</h5>
            <p className="text-muted small mb-3">{storageStats.percent}% Used</p>
            <div className="progress progress-xs mb-3" style={{ height: "8px" }}>
              <div
                className="progress-bar bg-primary"
                role="progressbar"
                style={{ width: `${storageStats.percent}%` }}
                aria-valuenow={storageStats.percent}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <span className="text-dark small fw-semibold">
              {storageStats.used} of {storageStats.limit}
            </span>
          </div>
        </div>

        {/* Directory Listings */}
        <div className="col-lg-9">
          {/* Breadcrumb Navigator */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
            <div className="card-body p-3">
              <nav aria-label="breadcrumb" className="m-0">
                <ol className="breadcrumb m-0" style={{ fontSize: "0.95rem" }}>
                  <li className="breadcrumb-item">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-primary fw-semibold"
                      style={{ textDecoration: "none" }}
                      onClick={() => handleBreadcrumbClick(null, 0)}
                    >
                      Root Files
                    </button>
                  </li>
                  {folderHistory.map((hist, idx) => (
                    <li className="breadcrumb-item" key={hist.id || idx}>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-primary fw-semibold"
                        style={{ textDecoration: "none" }}
                        onClick={() => handleBreadcrumbClick(hist.id, idx + 1)}
                      >
                        {hist.name}
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>

          {/* Files Grid and List */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">Loading files...</div>
              ) : files.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="ti ti-folder fs-1 mb-2 text-muted" style={{ opacity: 0.5 }}></i>
                  <p className="mb-0">This directory is empty</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr className="bg-light">
                        <th style={{ color: "#64748b" }}>Name</th>
                        <th style={{ color: "#64748b" }}>Size</th>
                        <th style={{ color: "#64748b" }}>Type</th>
                        <th style={{ color: "#64748b" }}>Date Created</th>
                        <th className="text-end" style={{ color: "#64748b" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.id}>
                           <td>
                             {file.isDirectory ? (
                               <button
                                 type="button"
                                 className="btn btn-link p-0 text-dark fw-semibold d-flex align-items-center gap-2"
                                 style={{ textDecoration: "none" }}
                                 onClick={() => handleFolderClick(file)}
                               >
                                 <i className="ti ti-folder text-warning fs-4"></i>
                                 {file.name}
                               </button>
                             ) : (
                               file.path ? (
                                 <a
                                   href={`${API_BASE}${file.path}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="d-flex align-items-center gap-2 text-primary fw-semibold"
                                   style={{ textDecoration: "none" }}
                                 >
                                   <i className="ti ti-file-text text-primary fs-4"></i>
                                   {file.name}
                                 </a>
                               ) : (
                                 <span className="d-flex align-items-center gap-2 text-dark">
                                   <i className="ti ti-file-text text-primary fs-4"></i>
                                   {file.name}
                                 </span>
                               )
                             )}
                           </td>
                           <td style={{ verticalAlign: "middle" }}>
                             {file.isDirectory ? "-" : formatBytes(file.size)}
                           </td>
                           <td style={{ verticalAlign: "middle" }}>
                             {file.isDirectory ? "Folder" : file.type?.toUpperCase()}
                           </td>
                           <td style={{ verticalAlign: "middle" }}>
                             {new Date(file.createdAt).toLocaleDateString()}
                           </td>
                           <td className="text-end" style={{ verticalAlign: "middle" }}>
                             {!file.isDirectory && file.path && (
                               <a
                                 href={`${API_BASE}${file.path}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="btn btn-sm btn-outline-primary btn-circle me-2"
                                 title="View / Download"
                               >
                                 <i className="ti ti-download"></i>
                               </a>
                             )}
                             <button
                               type="button"
                               className="btn btn-sm btn-outline-danger btn-circle"
                               onClick={() => handleDeleteFile(file.id)}
                             >
                               <i className="ti ti-trash"></i>
                             </button>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Folder Modal */}
      <div className="modal fade" id="add_folder" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: 12 }}>
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-bold text-dark">Create Folder</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleCreateFolder}>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Folder Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter folder name"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Upload File Modal */}
      <div className="modal fade" id="upload_file" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: 12 }}>
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-bold text-dark">Upload File</h5>
              <button 
                type="button" 
                className="btn-close" 
                data-bs-dismiss="modal" 
                aria-label="Close"
                onClick={() => setSelectedFile(null)}
              ></button>
            </div>
            <form onSubmit={handleUploadFile}>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Select File from Device</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      } else {
                        setSelectedFile(null);
                      }
                    }}
                    required
                  />
                </div>
                {selectedFile && (
                  <div className="mt-3 p-3 bg-light rounded" style={{ fontSize: "0.9rem" }}>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Name:</span>
                      <span className="fw-semibold text-dark text-truncate ms-2" style={{ maxWidth: "250px" }}>{selectedFile.name}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Size:</span>
                      <span className="fw-semibold text-dark">{formatBytes(selectedFile.size)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Type:</span>
                      <span className="fw-semibold text-dark">{selectedFile.name.split('.').pop()?.toUpperCase() || "Unknown"}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  data-bs-dismiss="modal"
                  onClick={() => setSelectedFile(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
