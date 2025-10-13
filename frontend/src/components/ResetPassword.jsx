import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { 
  ArrowLeft, 
  Lock, 
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      toast.error('Invalid reset link', {
        description: 'The password reset link is invalid or has expired.'
      });
      // Navigate back after 2 seconds
      setTimeout(() => navigate('/courier/profile'), 2000);
    }
  }, [searchParams, navigate]);

  // Password validation function (commented out for now)
  // const validatePassword = (password) => {
  //   const minLength = password.length >= 8;
  //   const hasUpperCase = /[A-Z]/.test(password);
  //   const hasLowerCase = /[a-z]/.test(password);
  //   const hasNumber = /\d/.test(password);
  //   const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  //   
  //   if (!minLength) {
  //     return 'Password must be at least 8 characters long';
  //   }
  //   if (!hasUpperCase) {
  //     return 'Password must contain at least one uppercase letter';
  //   }
  //   if (!hasLowerCase) {
  //     return 'Password must contain at least one lowercase letter';
  //   }
  //   if (!hasNumber) {
  //     return 'Password must contain at least one number';
  //   }
  //   if (!hasSpecialChar) {
  //     return 'Password must contain at least one special character';
  //   }
  //   return null;
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validation
    if (!newPassword.trim()) {
      setErrors({ newPassword: 'New password is required' });
      return;
    }

    // Uncomment this when password validation rules are needed
    // const passwordError = validatePassword(newPassword);
    // if (passwordError) {
    //   setErrors({ newPassword: passwordError });
    //   return;
    // }
    
    if (!confirmPassword.trim()) {
      setErrors({ confirmPassword: 'Please confirm your password' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation - check if email is valid
      const validEmails = [
        'john.martinez@courier.com',
        'courier@example.com',
        'demo@courier.com'
      ];
      
      if (!validEmails.includes(email.toLowerCase())) {
        setErrors({ submit: 'Invalid reset link. Please request a new password reset.' });
        setIsLoading(false);
        return;
      }
      
      toast.success('Password reset successfully!', {
        description: 'You can now log in with your new password.'
      });
      
      // Redirect to /courier/ after successful reset
      setTimeout(() => {
        navigate('/courier/');
      }, 1500);
      
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' });
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-blue-600" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900">
            Reset Your Password
          </CardTitle>
          
          <p className="text-gray-600 mt-2">
            Enter your new password below to complete the reset process.
          </p>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errors.submit}
                </AlertDescription>
              </Alert>
            )}

            {/* Email Display (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              
              <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2">
                <p className="text-sm text-gray-900">{email}</p>
              </div>
            </div>

            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                New Password
              </Label>
              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) {
                      setErrors(prev => ({ ...prev, newPassword: null }));
                    }
                  }}
                  className={`pl-10 pr-10 ${errors.newPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {errors.newPassword && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.newPassword}
                </p>
              )}
              
              {/* Password requirements hint (commented out for now) */}
              {/* <div className="text-xs text-gray-500 space-y-1 mt-2">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character</li>
                </ul>
              </div> */}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: null }));
                    }
                  }}
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
              data-testid="reset-password-submit-button"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Resetting Password...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Reset Password
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Remember your password?
            </p>
            
            <Link to="/courier/profile">
              <Button variant="outline" className="w-full" data-testid="back-to-profile-button">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Button>
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Security Tips
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Use a strong, unique password</li>
              <li>• Don't reuse passwords from other accounts</li>
              <li>• Keep your password confidential</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
