import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const AddressSection = () => {
    return (
        <div className="p-4">
            <Link to="/user/addresses">
            <button
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left"
            >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Daftar Alamat</h4>
                    <p className="text-sm text-gray-500">Pengaturan alamat tujuan</p>
                </div>
            </button>
            </Link>
        </div>
    );
};

export default AddressSection;