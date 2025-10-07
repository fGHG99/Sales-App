import { useState } from 'react';
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const ProfileCompletion = ({ userData }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Helper function untuk validasi field
    const isFieldComplete = (value) => {
        if (!value) return false;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim() !== '';
        return true;
    };

    const profileFields = [
        { label: 'Full Name', value: userData.name, required: true },
        { label: 'Email Address', value: userData.email, required: true },
        { label: 'Phone Number', value: userData.phone, required: true },
        { label: 'Home Address', value: userData.addresses, required: false },
        { label: 'Date of Birth', value: userData.dob, required: false },
    ];

    const completedFields = profileFields.filter(field => isFieldComplete(field.value));
    const completionPercentage = Math.round((completedFields.length / profileFields.length) * 100);

    const getProgressColor = () => {
        if (completionPercentage >= 80) return 'bg-green-500';
        if (completionPercentage >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getProgressTextColor = () => {
        if (completionPercentage >= 80) return 'text-green-600';
        if (completionPercentage >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="p-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        {completionPercentage === 100 ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                        )}
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-gray-900">Profile Completion</p>
                        <p className={`text-sm ${getProgressTextColor()}`}>
                            {completionPercentage}% Complete
                        </p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
            </button>

            {/* Progress Bar */}
            <div className="mt-3 px-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-4 space-y-2">
                    {profileFields.map((field, index) => (
                        <div key={index} className="flex items-center justify-between px-3 py-2">
                            <span className="text-sm text-gray-600">{field.label}</span>
                            <div className="flex items-center gap-2">
                                {field.required && (
                                    <span className="text-xs text-red-500">*</span>
                                )}
                                {isFieldComplete(field.value) ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-gray-400" />
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="pt-2">
                        <button
                            onClick={() => window.location.href = '/user/profile'}
                            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Complete your profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileCompletion;
