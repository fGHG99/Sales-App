import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import UserCard from './UserCard';
import ProfileCompletion from './ProfileCompletion';
import AddressSection from './AddressSection';
import LogoutModal from '../../modal/logout-confirmation';

const UserDropdown = ({ userData, onClose }) => {
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Use provided userData or fallback to default
    const user = userData || {
        name: 'User',
        email: 'user@example.com',
        avatar: null,
        phone: '',
        address: '',
        birthDate: '',
        company: ''
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        // Add your logout logic here
        console.log('User logged out');
        setShowLogoutModal(false);
        if (onClose) onClose();
        // Add actual logout functionality here
        // For example: dispatch logout action, clear localStorage, redirect, etc.
    };

    return (
        <>
            {/* Dropdown Menu */}
            <div className="w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* User Card Section */}
                <UserCard userData={user} />
                
                {/* Divider */}
                <div className="h-px bg-gray-100 mx-4" />
                
                {/* Profile Completion Section */}
                <ProfileCompletion userData={user} />
                
                {/* Divider */}
                <div className="h-px bg-gray-100 mx-4" />
                
                {/* Address Section */}
                <AddressSection />
                
                {/* Divider */}
                <div className="h-px bg-gray-100 mx-4" />
                
                {/* Logout Section */}
                <div className="p-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors duration-200 group"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Logout Modal */}
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
            />
        </>
    );
};

export default UserDropdown;