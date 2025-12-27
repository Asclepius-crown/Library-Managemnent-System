// ToastArea.jsx
export default function ToastArea({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded px-4 py-2 text-white ${
            t.type === "success"
              ? "bg-green-600"
              : t.type === "error"
              ? "bg-red-600"
              : "bg-gray-600"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
