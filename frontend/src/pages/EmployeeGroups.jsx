import { useState, useEffect, useRef } from "react";
import API from "../services/api";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:wght@400;500&display=swap');

  .eg-root { font-family: 'DM Sans', sans-serif; }

  .eg-page { max-width: 1100px; margin: 0 auto; padding: 24px; }

  .eg-heading {
    font-family: 'Playfair Display', serif;
    font-weight: 500;
    font-size: 22px;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin: 0 0 2px;
  }

  .eg-subheading {
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #94a3b8;
    margin: 0 0 24px;
  }

  .eg-section-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #cbd5e1;
    margin-bottom: 8px;
  }

  .eg-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 16px;
  }

  @media (max-width: 768px) {
    .eg-grid { grid-template-columns: 1fr; }
  }

  /* Group cards */
  .eg-group-card {
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.06);
    border-radius: 10px;
    padding: 14px 16px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.12s ease;
    margin-bottom: 8px;
  }

  .eg-group-card:hover { border-color: rgba(83, 74, 183, 0.3); }

  .eg-group-card.active {
    border-color: #534AB7;
    background: #EEEDFE;
  }

  .eg-leader-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: #FAC775;
    color: #412402;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-bottom-left-radius: 8px;
  }

  .eg-card-name {
    font-weight: 500;
    font-size: 13.5px;
    color: #0f172a;
    padding-right: 60px;
  }

  .eg-card-desc {
    font-size: 12px;
    color: #64748b;
    margin-top: 3px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .eg-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(83, 74, 183, 0.1);
  }

  .eg-card-meta { font-size: 11px; color: #64748b; }

  .eg-pill {
    background: rgba(83, 74, 183, 0.08);
    color: #534AB7;
    font-size: 10.5px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 20px;
  }

  /* Status widget (matches Sidebar) */
  .eg-status-widget {
    margin-top: 8px;
    padding: 10px 12px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid rgba(15, 23, 42, 0.05);
  }

  .eg-status-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #cbd5e1;
    margin-bottom: 7px;
  }

  .eg-status-row { display: flex; align-items: center; gap: 7px; }
  .eg-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; }
  .eg-status-text { font-size: 12px; color: #64748b; }

  /* Detail panel */
  .eg-detail-panel {
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.06);
    border-radius: 10px;
    padding: 20px;
    min-height: 480px;
  }

  .eg-detail-title {
    font-family: 'Playfair Display', serif;
    font-weight: 500;
    font-size: 18px;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin: 0 0 4px;
  }

  .eg-detail-desc { font-size: 13px; color: #64748b; margin: 0 0 8px; }

  .eg-detail-leader { font-size: 12px; color: #64748b; }
  .eg-detail-leader span { color: #534AB7; font-weight: 500; }

  .eg-sep { height: 1px; background: rgba(15, 23, 42, 0.05); margin: 14px 0; }

  /* Task cards */
  .eg-task-card {
    border: 1px solid rgba(15, 23, 42, 0.06);
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 10px;
    transition: border-color 0.12s ease;
  }

  .eg-task-card:hover { border-color: rgba(15, 23, 42, 0.12); }

  .eg-task-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 6px;
  }

  .eg-task-title { font-weight: 500; font-size: 13.5px; color: #0f172a; }
  .eg-task-desc { font-size: 12px; color: #64748b; margin: 4px 0 8px; line-height: 1.5; }
  .eg-task-due { font-size: 11px; font-weight: 500; color: #94a3b8; letter-spacing: 0.02em; margin-bottom: 8px; }

  /* Status badges */
  .eg-status {
    font-size: 10px;
    font-weight: 500;
    padding: 3px 9px;
    border-radius: 20px;
    border: 1px solid;
    white-space: nowrap;
    flex-shrink: 0;
    margin-left: 8px;
  }
  .eg-status-pending   { background: #F1EFE8; color: #5F5E5A; border-color: rgba(95,94,90,0.2); }
  .eg-status-progress  { background: #E6F1FB; color: #185FA5; border-color: rgba(24,95,165,0.2); }
  .eg-status-submitted { background: #FAEEDA; color: #854F0B; border-color: rgba(133,79,11,0.2); }
  .eg-status-completed { background: #EAF3DE; color: #3B6D11; border-color: rgba(59,109,17,0.2); }

  /* Feedback */
  .eg-feedback {
    background: #FCEBEB;
    border-left: 3px solid #E24B4A;
    border-radius: 0 6px 6px 0;
    padding: 8px 10px;
    margin-bottom: 10px;
  }
  .eg-feedback-label {
    font-size: 10px;
    font-weight: 500;
    color: #A32D2D;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 3px;
  }
  .eg-feedback-text { font-size: 12px; color: #993556; }

  /* Task footer */
  .eg-task-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(15, 23, 42, 0.05);
  }

  /* Buttons — matches Sidebar's clean style */
  .eg-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 8px;
    border: 1px solid rgba(83, 74, 183, 0.2);
    background: rgba(83, 74, 183, 0.06);
    color: #534AB7;
    font-size: 12px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: background 0.12s ease;
  }

  .eg-btn:hover { background: rgba(83, 74, 183, 0.12); }

  .eg-btn:disabled {
    background: #f1f5f9;
    color: #b4b2a9;
    border-color: rgba(180, 178, 169, 0.3);
    cursor: not-allowed;
  }

  .eg-proof-chip {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: #3B6D11;
    font-weight: 500;
  }

  .eg-proof-dot { width: 5px; height: 5px; border-radius: 50%; background: #3B6D11; }

  .eg-member-note { font-size: 11px; color: #94a3b8; font-style: italic; }

  /* Empty / no-selection states */
  .eg-empty {
    background: #f8fafc;
    border: 1px dashed rgba(15, 23, 42, 0.1);
    border-radius: 10px;
    padding: 40px 20px;
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
  }

  .eg-no-select {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 380px;
    color: #94a3b8;
    text-align: center;
  }

  .eg-no-select-icon { width: 40px; height: 40px; color: #cbd5e1; margin-bottom: 12px; }
  .eg-no-select-title { font-size: 14px; font-weight: 500; color: #475569; margin: 0 0 4px; }
  .eg-no-select-sub   { font-size: 13px; color: #94a3b8; max-width: 280px; }

  /* Modal — matches Sidebar's overlay approach */
  .eg-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.25);
    backdrop-filter: blur(4px);
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .eg-modal {
    background: #ffffff;
    border-radius: 12px;
    width: 100%;
    max-width: 440px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(15, 23, 42, 0.08);
    overflow: hidden;
  }

  .eg-modal-header {
    padding: 16px 20px;
    background: #0f172a;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .eg-modal-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #ffffff;
    margin: 0 0 2px;
  }

  .eg-modal-sub { font-size: 12px; color: rgba(255, 255, 255, 0.4); margin: 0; }

  .eg-modal-body { padding: 20px; overflow-y: auto; flex: 1; }

  .eg-modal-label {
    display: block;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 6px;
  }

  .eg-modal-select,
  .eg-modal-input,
  .eg-modal-textarea {
    width: 100%;
    border: 1px solid rgba(15, 23, 42, 0.1);
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    color: #0f172a;
    background: #ffffff;
    outline: none;
    transition: border-color 0.12s ease;
    box-sizing: border-box;
  }

  .eg-modal-select:focus,
  .eg-modal-input:focus,
  .eg-modal-textarea:focus { border-color: rgba(83, 74, 183, 0.4); }

  .eg-proof-section {
    margin-top: 16px;
    padding: 14px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid rgba(15, 23, 42, 0.05);
  }

  .eg-proof-section-title {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #cbd5e1;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  }

  .eg-img-preview { height: 100px; object-fit: contain; border-radius: 6px; border: 1px solid rgba(15,23,42,0.08); margin-top: 8px; }

  .eg-modal-footer {
    padding: 12px 20px;
    background: #f8fafc;
    border-top: 1px solid rgba(15, 23, 42, 0.06);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .eg-modal-cancel {
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    background: transparent;
    color: #64748b;
    font-size: 13px;
    font-weight: 400;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: background 0.12s ease;
  }

  .eg-modal-cancel:hover { background: #f1f5f9; color: #0f172a; }

  .eg-modal-submit {
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    background: #0f172a;
    color: #ffffff;
    font-size: 13px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: background 0.12s ease;
  }

  .eg-modal-submit:hover { background: #1e293b; }
`;

function getStatusClass(status) {
  if (status === "Completed") return "eg-status eg-status-completed";
  if (status === "Submitted") return "eg-status eg-status-submitted";
  if (status === "In Progress") return "eg-status eg-status-progress";
  return "eg-status eg-status-pending";
}

export default function EmployeeGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeGroupTasks, setActiveGroupTasks] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [taskToUpdate, setTaskToUpdate] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: "", proofType: "none", proofContent: "" });

  const fileInputRef = useRef(null);

  const [currentUserId] = useState(() => {
    let uid = localStorage.getItem("userId");
    if (!uid) {
      const token = localStorage.getItem("token") || localStorage.getItem("employeeToken");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          uid = payload.id || payload.userId;
        } catch (e) { }
      }
    }
    return uid || "";
  });

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await API.get("/groups");
      setGroups(res.data);
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (group) => {
    setSelectedGroup(group);
    try {
      const res = await API.get(`/groups/${group._id}/tasks`);
      setActiveGroupTasks(res.data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setUpdateForm((f) => ({ ...f, proofContent: reader.result, proofType: "image" }));
    reader.readAsDataURL(file);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/groups/task/${taskToUpdate._id}/status`, updateForm);
      setShowUpdateModal(false);
      fetchTasks(selectedGroup);
    } catch (err) {
      console.error("Update task error:", err);
      alert(err.response?.data?.message || "Error updating task. The file may be too large or you lack permissions.");
    }
  };

  const openUpdateModal = (task) => {
    setTaskToUpdate(task);
    setUpdateForm({
      status: task.status === "Pending" ? "In Progress" : task.status,
      proofType: task.proofType || "none",
      proofContent: task.proofContent || "",
    });
    setShowUpdateModal(true);
  };

  return (
    <div className="eg-root">
      <style>{styles}</style>

      <div className="eg-page">
        <h1 className="eg-heading">Group projects</h1>
        <p className="eg-subheading">Collaborative tasks &amp; milestones</p>

        {loading ? (
          <p style={{ fontSize: 13, color: "#94a3b8" }}>Loading your projects...</p>
        ) : (
          <div className="eg-grid">

            {/* ── Left column: group list ── */}
            <div>
              <p className="eg-section-label">Your groups</p>

              {groups.length === 0 ? (
                <div className="eg-empty">You are not assigned to any group projects.</div>
              ) : (
                groups.map((group) => {
                  const isLeader =
                    group.leaderId?._id === currentUserId ||
                    group.leaderId === currentUserId;
                  const active = selectedGroup?._id === group._id;

                  return (
                    <div
                      key={group._id}
                      className={`eg-group-card${active ? " active" : ""}`}
                      onClick={() => fetchTasks(group)}
                    >
                      {isLeader && <span className="eg-leader-badge">Group leader</span>}
                      <p className="eg-card-name">{group.name}</p>
                      <p className="eg-card-desc">{group.description}</p>
                      <div className="eg-card-footer">
                        <span className="eg-card-meta">
                          Due {new Date(group.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                        <span className="eg-pill">{group.members.length} members</span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Status widget matching Sidebar */}
              <div className="eg-status-widget">
                <p className="eg-status-label">Sync status</p>
                <div className="eg-status-row">
                  <span className="eg-status-dot" />
                  <span className="eg-status-text">All data up to date</span>
                </div>
              </div>
            </div>

            {/* ── Right column: detail + tasks ── */}
            <div>
              {selectedGroup ? (
                <div className="eg-detail-panel">
                  <p className="eg-detail-title">{selectedGroup.name}</p>
                  <p className="eg-detail-desc">{selectedGroup.description}</p>
                  <p className="eg-detail-leader">
                    Team leader:{" "}
                    <span>{selectedGroup.leaderId?.name || "N/A"}</span>
                  </p>

                  <div className="eg-sep" />
                  <p className="eg-section-label">Assigned tasks</p>

                  {activeGroupTasks.length === 0 ? (
                    <div className="eg-empty">Your team has no tasks assigned yet.</div>
                  ) : (
                    activeGroupTasks.map((task) => {
                      const isLeader =
                        selectedGroup.leaderId?._id === currentUserId ||
                        selectedGroup.leaderId === currentUserId;

                      return (
                        <div key={task._id} className="eg-task-card">
                          <div className="eg-task-row">
                            <span className="eg-task-title">{task.title}</span>
                            <span className={getStatusClass(task.status)}>
                              {task.status}
                            </span>
                          </div>

                          <p className="eg-task-desc">{task.description}</p>

                          {task.deadline && (
                            <p className="eg-task-due">
                              Due{" "}
                              {new Date(task.deadline).toLocaleDateString(undefined, {
                                month: "short", day: "numeric",
                              })}
                            </p>
                          )}

                          {task.hrFeedback && (
                            <div className="eg-feedback">
                              <p className="eg-feedback-label">HR review feedback</p>
                              <p className="eg-feedback-text">{task.hrFeedback}</p>
                            </div>
                          )}

                          <div className="eg-task-footer">
                            {isLeader ? (
                              <button
                                className="eg-btn"
                                onClick={() => openUpdateModal(task)}
                                disabled={task.status === "Completed"}
                              >
                                {task.status === "Completed"
                                  ? "Task completed"
                                  : "Update status & proof"}
                              </button>
                            ) : (
                              <span className="eg-member-note">
                                Only the group leader can submit proof.
                              </span>
                            )}

                            {task.proofType !== "none" && task.proofContent && (
                              <span className="eg-proof-chip">
                                <span className="eg-proof-dot" />
                                Proof attached
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="eg-detail-panel">
                  <div className="eg-no-select">
                    <svg className="eg-no-select-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="eg-no-select-title">No project selected</p>
                    <p className="eg-no-select-sub">
                      Select a project to view its tasks and manage team submissions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Update modal ── */}
      {showUpdateModal && taskToUpdate && (
        <div className="eg-modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="eg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eg-modal-header">
              <p className="eg-modal-title">Update task status</p>
              <p className="eg-modal-sub">{taskToUpdate.title}</p>
            </div>

            <div className="eg-modal-body">
              <form id="updateTaskForm" onSubmit={handleUpdateTask}>
                <label className="eg-modal-label">Task status</label>
                <select
                  required
                  className="eg-modal-select"
                  value={updateForm.status}
                  onChange={(e) =>
                    setUpdateForm({ ...updateForm, status: e.target.value })
                  }
                >
                  <option value="Pending" disabled>Pending</option>
                  <option value="In Progress">In progress</option>
                  <option value="Submitted">Submitted (send to HR for review)</option>
                </select>

                {updateForm.status === "Submitted" && (
                  <div className="eg-proof-section">
                    <p className="eg-proof-section-title">Proof of completion</p>

                    <label className="eg-modal-label">Format</label>
                    <select
                      required
                      className="eg-modal-select"
                      style={{ marginBottom: 12 }}
                      value={updateForm.proofType}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, proofType: e.target.value, proofContent: "" })
                      }
                    >
                      <option value="none">No proof required</option>
                      <option value="url">URL / link</option>
                      <option value="text">Text remarks</option>
                      <option value="image">Upload image</option>
                    </select>

                    {updateForm.proofType === "url" && (
                      <>
                        <label className="eg-modal-label">URL</label>
                        <input
                          type="url"
                          required
                          placeholder="https://example.com/document"
                          className="eg-modal-input"
                          value={updateForm.proofContent}
                          onChange={(e) =>
                            setUpdateForm({ ...updateForm, proofContent: e.target.value })
                          }
                        />
                      </>
                    )}

                    {updateForm.proofType === "text" && (
                      <>
                        <label className="eg-modal-label">Remarks</label>
                        <textarea
                          required
                          placeholder="Explain completion details..."
                          className="eg-modal-textarea"
                          rows={3}
                          value={updateForm.proofContent}
                          onChange={(e) =>
                            setUpdateForm({ ...updateForm, proofContent: e.target.value })
                          }
                        />
                      </>
                    )}

                    {updateForm.proofType === "image" && (
                      <>
                        <label className="eg-modal-label">Image file</label>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="eg-modal-input"
                        />
                        {updateForm.proofContent && (
                          <div style={{ position: "relative", display: "inline-block" }}>
                            <img
                              src={updateForm.proofContent}
                              alt="Preview"
                              className="eg-img-preview"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setUpdateForm({ ...updateForm, proofContent: "" });
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                              style={{
                                position: "absolute", top: 12, right: -8,
                                background: "#E24B4A", color: "white",
                                border: "none", borderRadius: "50%",
                                width: 20, height: 20, cursor: "pointer",
                                fontSize: 12, lineHeight: "20px", textAlign: "center",
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </form>
            </div>

            <div className="eg-modal-footer">
              <button
                type="button"
                className="eg-modal-cancel"
                onClick={() => setShowUpdateModal(false)}
              >
                Cancel
              </button>
              <button type="submit" form="updateTaskForm" className="eg-modal-submit">
                Update task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}