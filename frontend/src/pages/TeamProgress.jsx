import { useState, useEffect } from "react";
import API from "../services/api";

export default function TeamProgress() {
  const [groups, setGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [showReviewTask, setShowReviewTask] = useState(false);

  // State for active selections
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeGroupTasks, setActiveGroupTasks] = useState([]);

  // Form States
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    deadline: "",
    members: [],
    leaderId: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    deadline: "",
  });

  const [reviewForm, setReviewForm] = useState({
    action: "",
    hrFeedback: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, employeesRes] = await Promise.all([
        API.get("/groups"),
        API.get("/employees"),
      ]);
      setGroups(groupsRes.data);
      setEmployees(Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data.employees || []));
    } catch (error) {
      console.error("Failed to load team data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupTasks = async (groupId) => {
    try {
      const res = await API.get(`/groups/${groupId}/tasks`);
      setActiveGroupTasks(res.data);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await API.post("/groups/project", groupForm);
      setShowCreateGroup(false);
      setGroupForm({ name: "", description: "", deadline: "", members: [], leaderId: "" });
      fetchData();
    } catch (error) {
      alert("Error creating group");
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      await API.post("/groups/task", { ...taskForm, groupId: selectedGroupId });
      setShowAssignTask(false);
      setTaskForm({ title: "", description: "", deadline: "" });
      fetchGroupTasks(selectedGroupId);
    } catch (error) {
      alert("Error assigning task");
    }
  };

  const handleReviewTask = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/groups/task/${selectedTask._id}/review`, reviewForm);
      setShowReviewTask(false);
      setReviewForm({ action: "", hrFeedback: "" });
      fetchGroupTasks(selectedGroupId); // Refresh list
    } catch (error) {
      alert("Error submitting review");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Progress</h1>
          <p className="text-sm text-gray-500">Monitor group projects and review submissions.</p>
        </div>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Create Group Project
        </button>
      </div>

      {loading ? (
        <p>Loading projects...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups List */}
          <div className="lg:col-span-1 space-y-4">
            {groups.map((group) => (
              <div 
                key={group._id} 
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedGroupId === group._id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                onClick={() => {
                  setSelectedGroupId(group._id);
                  fetchGroupTasks(group._id);
                }}
              >
                <h3 className="font-bold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{group.description}</p>
                <div className="mt-3 flex justify-between items-center text-xs">
                  <span className="text-gray-600">Leader: {group.leaderId?.name || "N/A"}</span>
                  <span className="text-gray-600">Members: {group.members.length}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Group Details & Tasks */}
          <div className="lg:col-span-2">
            {selectedGroupId ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Group Tasks</h2>
                  <button
                    onClick={() => setShowAssignTask(true)}
                    className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm hover:bg-green-100"
                  >
                    + Assign New Task
                  </button>
                </div>

                {activeGroupTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tasks assigned to this group yet.</p>
                ) : (
                  <div className="space-y-4">
                    {activeGroupTasks.map(task => (
                      <div key={task._id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          </div>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full 
                            ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                              task.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' : 
                              task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                            {task.status}
                          </span>
                        </div>

                        {task.status === 'Submitted' && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm font-medium mb-2">Proof of Completion Submitted!</p>
                            {task.proofType === 'url' ? (
                              <a href={task.proofContent} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline">View Link</a>
                            ) : task.proofType === 'image' ? (
                              <img src={task.proofContent} alt="Proof" className="h-32 object-contain" />
                            ) : (
                              <p className="text-sm text-gray-700 bg-white p-2 border rounded">{task.proofContent}</p>
                            )}
                            
                            <button
                              onClick={() => { setSelectedTask(task); setShowReviewTask(true); }}
                              className="mt-3 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                            >
                              Review Submission
                            </button>
                          </div>
                        )}

                        {task.hrFeedback && (
                          <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
                            <strong>HR Feedback:</strong> {task.hrFeedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                Select a group to view progress and assignments.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Group Project</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name</label>
                <input required type="text" className="w-full border p-2 rounded" 
                  value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full border p-2 rounded" rows="2"
                  value={groupForm.description} onChange={e => setGroupForm({...groupForm, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deadline</label>
                <input required type="date" className="w-full border p-2 rounded" 
                  value={groupForm.deadline} onChange={e => setGroupForm({...groupForm, deadline: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select Members (hold Ctrl for multiple)</label>
                <select multiple className="w-full border p-2 rounded h-24"
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setGroupForm({...groupForm, members: options});
                  }}>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              {groupForm.members.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1 mt-4">Assign Leader</label>
                  <select required className="w-full border p-2 rounded"
                    value={groupForm.leaderId} onChange={e => setGroupForm({...groupForm, leaderId: e.target.value})}>
                    <option value="">Select a leader</option>
                    {employees.filter(emp => groupForm.members.includes(emp._id)).map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button type="button" onClick={() => setShowCreateGroup(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Construct Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {showAssignTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Assign Task to Group</h2>
            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Task Title</label>
                <input required type="text" className="w-full border p-2 rounded" 
                  value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Task Description</label>
                <textarea className="w-full border p-2 rounded" rows="3"
                  value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deadline (Optional)</label>
                <input type="date" className="w-full border p-2 rounded" 
                  value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowAssignTask(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {showReviewTask && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Review Submission for "{selectedTask.title}"</h2>
            <form onSubmit={handleReviewTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Decision</label>
                <select required className="w-full border p-2 rounded"
                  value={reviewForm.action} onChange={e => setReviewForm({...reviewForm, action: e.target.value})}>
                  <option value="">Select Action</option>
                  <option value="Accept">Accept (Mark Completed)</option>
                  <option value="Reject">Reject (Send back to In Progress)</option>
                </select>
              </div>
              {reviewForm.action === "Reject" && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-red-600">Rejection Feedback (Required)</label>
                  <textarea required className="w-full border-red-300 border p-2 rounded focus:ring-red-500" rows="3"
                    value={reviewForm.hrFeedback} onChange={e => setReviewForm({...reviewForm, hrFeedback: e.target.value})}></textarea>
                </div>
              )}
              {reviewForm.action === "Accept" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Positive Feedback (Optional)</label>
                  <textarea className="w-full border p-2 rounded" rows="2"
                    value={reviewForm.hrFeedback} onChange={e => setReviewForm({...reviewForm, hrFeedback: e.target.value})}></textarea>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowReviewTask(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Submit Decision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
