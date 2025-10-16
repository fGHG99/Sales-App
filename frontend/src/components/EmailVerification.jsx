import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Mail, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { verifyEmail, resendVerificationEmail } from "../services/userService";
import { toast } from "sonner";

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [isResending, setIsResending] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  useEffect(() => {
    const handleVerification = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token verifikasi tidak ditemukan");
        return;
      }

      try {
        const response = await verifyEmail(token);
        setStatus("success");
        setMessage(
          response.message ||
            "Email berhasil diverifikasi! Anda akan dialihkan ke halaman login."
        );
      } catch (error) {
        setStatus("error");
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Verifikasi gagal. Token mungkin sudah expired atau tidak valid.";
        setMessage(errorMessage);
      }
    };

    handleVerification();
  }, [token]);

  // Countdown for auto-redirect on success
  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (status === "success" && countdown === 0) {
      navigate("/auth/signin");
    }
  }, [status, countdown, navigate]);

  const handleNavigateToLogin = () => {
    navigate("/auth/signin");
  };

  const handleNavigateToRegister = () => {
    navigate("/auth/signup");
  };

  const handleResendVerification = async () => {
    if (!resendEmail || !resendEmail.trim()) {
      toast.error("Mohon masukkan alamat email Anda");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resendEmail)) {
      toast.error("Format email tidak valid");
      return;
    }

    try {
      setIsResending(true);
      const response = await resendVerificationEmail(resendEmail.trim());

      toast.success(
        response.message ||
          "Email verifikasi berhasil dikirim! Silakan cek inbox Anda."
      );

      // Optional: Clear email input after success
      setResendEmail("");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Gagal mengirim email verifikasi. Silakan coba lagi.";

      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // Loading State
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
        <Card className="w-full max-w-md border-blue-200 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Memverifikasi Email
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Mohon tunggu sebentar...
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-gray-500">
              <p>Kami sedang memverifikasi email Anda.</p>
              <p className="mt-2">
                Proses ini biasanya hanya memakan waktu beberapa detik.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success State
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 p-4">
        <Card className="w-full max-w-md border-green-200 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Verifikasi Berhasil!
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Email Anda telah berhasil diverifikasi
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-center text-green-900 text-sm">{message}</p>
            </div>

            <div className="space-y-3">
              <div className="text-center text-sm text-gray-600">
                <p>
                  Anda akan dialihkan ke halaman login dalam{" "}
                  <span className="font-bold text-green-600">{countdown}</span>{" "}
                  detik
                </p>
              </div>

              <Button
                onClick={handleNavigateToLogin}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Lanjut ke Login
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>Selamat! Akun Anda sudah aktif dan siap digunakan.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100 p-4">
      <Card className="w-full max-w-md border-red-200 shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Verifikasi Gagal
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Terjadi kesalahan saat memverifikasi email
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-center text-red-900 text-sm">{message}</p>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <p className="text-center">Kemungkinan penyebab:</p>
            <ul className="list-disc list-inside space-y-1 text-left pl-4">
              <li>Link verifikasi sudah expired</li>
              <li>Link sudah pernah digunakan</li>
              <li>Token verifikasi tidak valid</li>
            </ul>
          </div>

          {/* Resend Verification Section */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Kirim Ulang Email Verifikasi
              </h3>
              <p className="text-xs text-gray-600">
                Masukkan email Anda untuk menerima link verifikasi baru
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="resend-email" className="text-sm text-gray-700">
                  Alamat Email
                </Label>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="contoh@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  disabled={isResending}
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isResending) {
                      handleResendVerification();
                    }
                  }}
                />
              </div>

              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Kirim Ulang Email
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="space-y-3 border-t border-gray-200 pt-6">
            <Button
              onClick={handleNavigateToRegister}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-400"
            >
              <Mail className="w-4 h-4 mr-2" />
              Daftar Ulang
            </Button>

            <Button
              onClick={handleNavigateToLogin}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Kembali ke Login
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>
              Butuh bantuan? Hubungi{" "}
              <a
                href="mailto:support@salesapp.com"
                className="text-blue-600 hover:underline"
              >
                support@salesapp.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;
