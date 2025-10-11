import { Link } from "react-router-dom";

/**
 * LoginRequiredModal
 *
 * Modal sederhana yang memberitahu user bahwa mereka perlu login
 * untuk mengakses fitur tertentu (seperti keranjang belanja).
 *
 * @param {boolean} isOpen - Status modal (open/close)
 * @param {function} onClose - Callback untuk menutup modal
 * @param {string} title - Judul modal (default: "Masuk Diperlukan")
 * @param {string} message - Pesan yang ditampilkan (default: pesan keranjang)
 * @param {string} loginButtonText - Text untuk tombol login (default: "Masuk")
 * @param {string} cancelButtonText - Text untuk tombol batal (default: "Batal")
 */
const LoginRequiredModal = ({
  isOpen,
  onClose,
  title = "Masuk Diperlukan",
  message = "Anda perlu masuk untuk mengakses keranjang belanja.",
  loginButtonText = "Masuk",
  cancelButtonText = "Batal",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-4 font-inter text-gray-900">
          {title}
        </h2>
        <p className="text-gray-600 mb-6 font-inter">{message}</p>
        <div className="flex space-x-4">
          <Link
            to="/auth/signin"
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors duration-200 font-inter font-medium"
            onClick={onClose}
          >
            {loginButtonText}
          </Link>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-inter"
          >
            {cancelButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;
