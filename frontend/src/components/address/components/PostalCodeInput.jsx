import React from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

const PostalCodeInput = ({ value, error, onChange, selectedLocation }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="postalCode">Kode Pos *</Label>
      <Input
        id="postalCode"
        type="text"
        placeholder="Contoh: 40154"
        maxLength={5}
        value={value}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");
          onChange(value);
        }}
        className={error ? "border-red-500" : ""}
      />
      {selectedLocation && value && (
        <p className="text-xs text-green-600">
          Auto-filled dari koordinat peta
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default PostalCodeInput;
