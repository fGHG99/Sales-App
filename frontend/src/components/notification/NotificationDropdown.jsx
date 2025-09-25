import { useState, useEffect } from 'react';
import { Package, User, X, Truck, CreditCard, ShoppingBag, Shield, Mail, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = ({ isOpen, onToggle }) => {
    const [activeTab, setActiveTab] = useState('transaction');
    const [isMobile, setIsMobile] = useState(false);
    const navigate =  useNavigate();
    const toLink = () => {
        navigate('/notifications');
    };

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const transactionNotifications = [
        {
            id: '1',
            type: 'delivery',
            title: 'Pesanan Sampai Di Tujuan',
            description: 'Pesanan dengan nomor A1N3CIRZJ sudah sampai di tujuan. Pastikan pesananmu sesuai.',
            timestamp: '2 hari yang lalu',
            category: 'Grocery',
            status: 'success',
            product: {
                name: 'Chitato Snack Potato Chips Cheese Supreme 68G',
                image: 'https://images.pexels.com/photos/4518666/pexels-photo-4518666.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1'
            }
        },
        {
            id: '2',
            type: 'payment',
            title: 'Pembayaran Berhasil',
            description: 'Pembayaran untuk pesanan #ORD123456 telah berhasil diproses.',
            timestamp: '3 hari yang lalu',
            category: 'Electronics',
            status: 'success',
            product: {
                name: 'Wireless Bluetooth Earbuds Premium Quality',
                image: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1'
            }
        },
        {
            id: '3',
            type: 'order',
            title: 'Pesanan Sedang Diproses',
            description: 'Pesanan #ORD789012 sedang dalam tahap persiapan dan akan segera dikirim.',
            timestamp: '5 jam yang lalu',
            category: 'Fashion',
            status: 'pending',
            product: {
                name: 'Cotton T-Shirt Premium Collection',
                image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1'
            }
        }
    ];

    const informationNotifications = [
        {
            id: '1',
            type: 'profile',
            title: 'Nama Profil Diperbarui',
            description: 'Nama profil Anda telah berhasil diubah dari "John Doe" menjadi "John Smith".',
            timestamp: '1 hari yang lalu',
            status: 'success'
        },
        {
            id: '2',
            type: 'security',
            title: 'Login dari Perangkat Baru',
            description: 'Akun Anda telah diakses dari perangkat baru. Jika ini bukan Anda, segera ubah password.',
            timestamp: '4 hari yang lalu',
            status: 'warning'
        },
        {
            id: '3',
            type: 'account',
            title: 'Email Berhasil Diverifikasi',
            description: 'Alamat email baru john.smith@example.com telah berhasil diverifikasi.',
            timestamp: '1 minggu yang lalu',
            status: 'info'
        }
    ];

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'delivery': return <Truck className="w-4 h-4" />;
            case 'payment': return <CreditCard className="w-4 h-4" />;
            case 'order': return <ShoppingBag className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    const getInformationIcon = (type) => {
        switch (type) {
            case 'profile': return <User className="w-4 h-4" />;
            case 'security': return <Shield className="w-4 h-4" />;
            case 'account': return <Mail className="w-4 h-4" />;
            default: return <Settings className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'text-green-600 bg-green-50';
            case 'warning': return 'text-amber-600 bg-amber-50';
            case 'pending': return 'text-blue-600 bg-blue-50';
            case 'info': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (!isOpen) return null;

    // Mobile Modal Layout
    if (isMobile) {
        return (
            <>
                {/* Mobile Overlay */}
                <div 
                    className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm"
                    onClick={onToggle}
                />
                
                {/* Mobile Modal */}
                <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900">Notifikasi</h3>
                        <button
                            onClick={onToggle}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Mobile Tabs */}
                    <div className="flex border-b border-gray-100 bg-gray-50">
                        <button
                            onClick={() => setActiveTab('transaction')}
                            className={`flex-1 py-4 px-6 text-base font-semibold transition-all relative ${
                                activeTab === 'transaction'
                                    ? 'text-blue-600 bg-white'
                                    : 'text-gray-500'
                            }`}
                        >
                            Transaksi
                            {activeTab === 'transaction' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('information')}
                            className={`flex-1 py-4 px-6 text-base font-semibold transition-all relative ${
                                activeTab === 'information'
                                    ? 'text-blue-600 bg-white'
                                    : 'text-gray-500'
                            }`}
                        >
                            Informasi
                            {activeTab === 'information' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Content */}
                    <div className="flex-1 overflow-hidden">
                        <div className="h-full overflow-y-auto overscroll-contain">
                            {activeTab === 'transaction' && (
                                <div className="p-4 space-y-4">
                                    {transactionNotifications.map((notification, index) => (
                                        <div key={notification.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                                            {/* Category Badge */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(notification.status)}`}>
                                                    {getTransactionIcon(notification.type)}
                                                    <span className="ml-2">{notification.category}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">{notification.timestamp}</span>
                                            </div>
                                            
                                            {/* Title & Description */}
                                            <h4 className="font-bold text-gray-900 mb-2 text-base">{notification.title}</h4>
                                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{notification.description}</p>
                                            
                                            {/* Product Card */}
                                            {notification.product && (
                                                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                                                    <img
                                                        src={notification.product.image}
                                                        alt={notification.product.name}
                                                        className="w-14 h-14 rounded-xl object-cover shadow-sm"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 leading-tight">
                                                            {notification.product.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'information' && (
                                <div className="p-4 space-y-4">
                                    {informationNotifications.map((notification) => (
                                        <div key={notification.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                                            <div className="flex items-start space-x-3">
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(notification.status)}`}>
                                                    {getInformationIcon(notification.type)}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-gray-900 text-base">{notification.title}</h4>
                                                        <span className="text-xs text-gray-400 ml-2">{notification.timestamp}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed">{notification.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Footer */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <button className="w-full py-3 text-center text-base text-blue-600 hover:text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                            Lihat Selengkapnya
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // Desktop Dropdown Layout
    return (
        <>
            
            {/* Desktop Dropdown */}
            <div className="absolute top-full right-0 mt-3 w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Notifikasi</h3>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-50">
                    <button
                        onClick={() => setActiveTab('transaction')}
                        className={`flex-1 py-4 px-6 text-sm font-semibold transition-all relative ${
                            activeTab === 'transaction'
                                ? 'text-blue-600 bg-white'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Transaksi
                        {activeTab === 'transaction' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('information')}
                        className={`flex-1 py-4 px-6 text-sm font-semibold transition-all relative ${
                            activeTab === 'information'
                                ? 'text-blue-600 bg-white'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Informasi
                        {activeTab === 'information' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="h-96 overflow-hidden">
                    <div className="h-full overflow-y-auto scrollbar-hide">
                        {activeTab === 'transaction' && (
                            <div className="p-4 space-y-3">
                                {transactionNotifications.map((notification, index) => (
                                    <div key={notification.id} className="group hover:bg-gray-50 rounded-xl p-4 transition-all duration-200 border border-transparent hover:border-gray-200 hover:shadow-sm">
                                        {/* Category Badge */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(notification.status)}`}>
                                                {getTransactionIcon(notification.type)}
                                                <span className="ml-2">{notification.category}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">{notification.timestamp}</span>
                                        </div>
                                        
                                        {/* Title & Description */}
                                        <h4 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{notification.title}</h4>
                                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{notification.description}</p>
                                        
                                        {/* Product Card */}
                                        {notification.product && (
                                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                                                <img
                                                    src={notification.product.image}
                                                    alt={notification.product.name}
                                                    className="w-12 h-12 rounded-lg object-cover shadow-sm"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                                                        {notification.product.name}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {index < transactionNotifications.length - 1 && (
                                            <div className="mt-4 border-b border-gray-100"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'information' && (
                            <div className="p-4 space-y-3">
                                {informationNotifications.map((notification, index) => (
                                    <div key={notification.id} className="group hover:bg-gray-50 rounded-xl p-4 transition-all duration-200 border border-transparent hover:border-gray-200 hover:shadow-sm">
                                        <div className="flex items-start space-x-3">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(notification.status)}`}>
                                                {getInformationIcon(notification.type)}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{notification.title}</h4>
                                                    <span className="text-xs text-gray-400 ml-2">{notification.timestamp}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 leading-relaxed">{notification.description}</p>
                                            </div>
                                        </div>
                                        
                                        {index < informationNotifications.length - 1 && (
                                            <div className="mt-4 border-b border-gray-100"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={toLink}
                        className="w-full py-3 text-center text-sm text-blue-600 hover:text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                        Lihat Selengkapnya
                    </button>
                </div>
            </div>
        </>
    );
};

export default NotificationDropdown;
