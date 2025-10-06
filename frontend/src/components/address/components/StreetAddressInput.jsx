import React from "react";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";

const StreetAddressInput = ({ value, error, onChange, selectedLocation }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="streetAddress">Alamat Jalan *</Label>
      <Textarea
        id="streetAddress"
        placeholder="Contoh: Jl. Gempol Sari No. 123, RT 02/RW 05, Perumahan ABC, Patokan: Dekat Indomaret"
        rows={3}
        value={value}
        onChange={onChange}
        className={error ? "border-red-500" : ""}
      />
      {selectedLocation && value && (
        <p className="text-xs text-green-600">
          Auto-filled dari koordinat peta
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-gray-500">
        Berikan detail lengkap termasuk nama jalan, nomor rumah, RT/RW, dan
        patokan yang mudah ditemukan
      </p>
    </div>
  );
};

export default StreetAddressInput;
