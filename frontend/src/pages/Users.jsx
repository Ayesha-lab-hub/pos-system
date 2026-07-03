import React, { useState, useEffect } from "react";
import { getUsers, createUser, deleteUser, updatePassword } from "../services/api";
import { FaTrash, FaUserPlus, FaUsers, FaKey } from "react-icons/fa";
import { toast } from "react-toastify";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPLOYEE");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser({ username, password, role });
      toast.success("User created successfully");
      setUsername("");
      setPassword("");
      setRole("EMPLOYEE");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (name === "admin") {
      toast.error("Cannot delete master admin!");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(id);
        toast.success("User deleted");
        fetchUsers();
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    try {
      await updatePassword(selectedUserForPassword._id, newPassword);
      toast.success("Password updated successfully");
      setShowPasswordModal(false);
      setNewPassword("");
      setSelectedUserForPassword(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    }
  };

  if (loading) return <div className="text-center mt-10 font-bold">Loading Users...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FaUsers className="text-orange-500" /> User Management
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 h-fit">
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <FaUserPlus className="text-indigo-500" /> Add New User
          </h2>
          <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Username</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Password</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Role</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Create User
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
          <h2 className="text-lg font-bold text-gray-700 mb-4">Existing Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                  <th className="p-3 font-semibold">Username</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Created</th>
                  <th className="p-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{u.username}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUserForPassword(u);
                            setNewPassword("");
                            setShowPasswordModal(true);
                          }}
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-full transition-colors"
                          title="Change Password"
                        >
                          <FaKey />
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u._id, u.username)}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                            title="Delete User"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-slideUp">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Change Password</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Enter a new password for <strong>{selectedUserForPassword?.username}</strong>.
            </p>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-6 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleChangePassword}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
