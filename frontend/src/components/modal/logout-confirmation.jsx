import { LogOut, X } from "lucide-react";
// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogTitle,
//   AlertDialogAction,
//   AlertDialogCancel,
// } from "@/components/ui/alert-dialog";

// const LogoutModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
//   return (
//     <AlertDialog open={isOpen} onOpenChange={onClose}>
//       <AlertDialogContent className="max-w-md p-0 gap-0">
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-gray-200">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
//               <LogOut className="w-5 h-5 text-red-600" />
//             </div>
//             <AlertDialogTitle className="text-lg font-semibold text-gray-900">
//               Confirm Logout
//             </AlertDialogTitle>
//           </div>
//           <button
//             onClick={onClose}
//             disabled={isLoading}
//             className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="p-6">
//           <p className="text-gray-600 mb-6">
//             Are you sure you want to logout? You'll need to sign in again to
//             access your account.
//           </p>

//           {/* Actions */}
//           <div className="flex gap-3">
//             <AlertDialogCancel 
//               disabled={isLoading}
//               className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Cancel
//             </AlertDialogCancel>
            
//             <AlertDialogAction
//               onClick={(e) => {
//                 e.preventDefault(); // Prevent default close behavior
//                 console.log("🟢 AlertDialogAction clicked!");
//                 if (onConfirm) {
//                   onConfirm();
//                 }
//               }}
//               disabled={isLoading}
//               className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isLoading ? "Logging out..." : "Logout"}
//             </AlertDialogAction>
//           </div>
//         </div>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// };

// export default LogoutModal;

const LogoutModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Confirm Logout
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to logout? You'll need to sign in again to
            access your account.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                console.log("❌ Cancel clicked");
                onClose();
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                console.log("🟢 LOGOUT CLICKED!");
                if (onConfirm) {
                  onConfirm();
                }
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
