const Instruction = () => {
    return (
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Petunjuk Penggunaan:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Klik pada peta untuk menambah marker</li>
          <li>• Gunakan "Lokasi Saya" untuk menemukan posisi Anda</li>
          <li>• Hapus marker untuk menghapus marker saat ini</li>
          <li>• Cari tempat menggunakan search bar</li>
          <li>• Klik marker untuk melihat popup</li>
          <li>• Drag untuk menggeser, scroll untuk zoom</li>
          <li>• Gunakan tombol kontrol</li>
        </ul>
      </div>
    );
}

export default Instruction;