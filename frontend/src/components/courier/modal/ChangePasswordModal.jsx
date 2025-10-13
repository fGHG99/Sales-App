import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import api from "@/utils/api";
import { useAuth } from "@/components/middleware/AuthContext";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { handleLogout } = useAuth();

  // Validasi input
  const validateInput = () => {
    const validations = [
      { condition: !oldPassword || !newPassword || !confirmPassword, message: "Semua field wajib diisi." },
      { condition: newPassword !== confirmPassword, message: "Konfirmasi password tidak cocok." },
      { condition: newPassword.length < 6, message: "Password baru minimal 6 karakter." }
    ];

    const failed = validations.find(v => v.condition);
    if (failed) {
      setError(failed.message);
      return false;
    }
    return true;
  };

  // Handle error response
  const handleErrorResponse = (err) => {
    const errorMessages = {
      401: "Password lama salah.",
      400: "Data tidak valid. Periksa kembali input Anda.",
      500: "Terjadi kesalahan pada server. Silakan coba lagi."
    };

    const backendError = err?.response?.data?.error;
    const statusCode = err?.response?.status;
    
    return backendError || errorMessages[statusCode] || "Gagal mengubah password. Silakan coba lagi.";
  };

  // Reset form
  const resetForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  };

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (!validateInput()) return;

    try {
      setIsSubmitting(true);
      
      const response = await api.post("/auth/change-password", {
        oldPassword,
        newPassword,
        confirmPassword,
      });

      setSuccess(response.data.message || "Password berhasil diubah!");
      resetForm();

      setTimeout(async () => {
        await handleLogout();
      }, 2000);

    } catch (err) {
      console.error("❌ Change password error:", err);
      setError(handleErrorResponse(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ganti Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Password Lama</Label>
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Masukkan password lama"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label>Password Baru</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan password baru (min. 6 karakter)"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label>Konfirmasi Password Baru</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-600 font-medium">{success}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;