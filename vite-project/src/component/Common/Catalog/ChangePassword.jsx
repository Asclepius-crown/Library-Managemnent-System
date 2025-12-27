// ChangePasswordModal.jsx
export default function ChangePasswordModal({
  show,
  onClose,
  passwords,
  setPasswords,
  handleChangePassword,
  loadingChangePass,
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 p-6 rounded max-w-md w-full relative">
        <button className="absolute top-4 right-4 text-white" onClick={onClose}>&times;</button>
        <h2 className="text-white text-xl mb-4">Change Password</h2>
        <input
          type="password"
          placeholder="Current Password"
          value={passwords.current}
          onChange={(e) =>
            setPasswords({ ...passwords, current: e.target.value })
          }
          className="bg-gray-800 p-2 rounded w-full mb-3"
          autoComplete="current-password"
        />
        <input
          type="password"
          placeholder="New Password"
          value={passwords.newPass}
          onChange={(e) =>
            setPasswords({ ...passwords, newPass: e.target.value })
          }
          className="bg-gray-800 p-2 rounded w-full"
          autoComplete="new-password"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleChangePassword}
            disabled={loadingChangePass}
            className="bg-cyan-600 px-4 py-2 rounded"
          >
            {loadingChangePass ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
