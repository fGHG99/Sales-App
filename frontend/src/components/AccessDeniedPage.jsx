import { useNavigate } from "react-router-dom";
import { ShieldAlert, Lock } from "lucide-react";
import { Button } from "./ui/button";

const AccessDeniedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full text-center bg-white p-8 rounded-xl shadow-md">
        <ShieldAlert className="h-20 w-20 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have the required permissions to access this page.
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button className="flex-1" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
