import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export function EmailVerificationSent({ email, onResendEmail, onBackToLogin }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <Card className="w-full max-w-md border-blue-200 shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              We've sent a verification link to
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-center text-blue-900 font-medium break-all">
              {email}
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <p className="text-center">
              Click the link in the email to verify your account and complete
              your registration.
            </p>
            <p className="text-center text-xs text-gray-500">
              Didn't receive the email? Check your spam folder.
            </p>
          </div>

          <div className="space-y-3">
            {onResendEmail && (
              <Button
                onClick={onResendEmail}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-400"
              >
                Resend Verification Email
              </Button>
            )}

            {onBackToLogin && (
              <Button
                onClick={onBackToLogin}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
