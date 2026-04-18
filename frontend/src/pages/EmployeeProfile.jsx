import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function EmployeeProfile() {
  const [profile, setProfile] = useState(null);
  const token = localStorage.getItem("employeeToken");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/employee-auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfile(res.data);
    } catch (err) {
      console.error("Profile fetch error:", err.response || err.message || err);
      setError(err.response?.data?.error || "Failed to load profile");
      if (err.response?.status === 401) {
        // token invalid or expired
        localStorage.removeItem("employeeToken");
        navigate("/");
      }
    }
  };

  const handleUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePic", file);

      await API.post("/auth/upload-profile-pic", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      alert("Profile picture updated successfully!");
      fetchProfile();
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Failed to upload image");
    }
  };

  if (!profile) {
    return <div className="p-6">{error ? <span className="text-red-600">{error}</span> : "Loading..."}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-3xl mx-auto">
        
        <div className="flex items-center gap-6 mb-6">
          <div className="relative group">
            {profile.profilePic ? (
              <img 
                src={`${API.defaults.baseURL.replace('/api', '')}${profile.profilePic}`} 
                alt={profile.name} 
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg">
                {profile.name.charAt(0)}
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) handleUpload(e.target.files[0]);
                }} 
              />
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </label>
          </div>

          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">{profile.name}</h2>
            <p className="text-blue-600 font-medium">{profile.email}</p>
            <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest font-bold">
              {profile.department}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Skills</h4>
            {profile.skills.length > 0 ? (
              profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mr-2 mb-2"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-gray-500">No skills added</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Wallet Address</h4>
            <p className="text-gray-700 break-all">
              {profile.walletAddress || "Not added"}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Account Status</h4>
            <p
              className={`font-bold ${
                profile.isActive ? "text-green-600" : "text-red-600"
              }`}
            >
              {profile.isActive ? "Active" : "Inactive"}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Joined On</h4>
            <p>
              {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default EmployeeProfile;