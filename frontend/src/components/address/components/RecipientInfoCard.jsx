import React from "react";
import { User } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

const RecipientInfoCard = ({ formData, errors, onInputChange }) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          Informasi Penerima
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="recipientName">Nama Penerima *</Label>
            <Input
              id="recipientName"
              type="text"
              placeholder="Masukkan nama lengkap penerima"
              value={formData.recipientName}
              onChange={(e) => onInputChange("recipientName", e.target.value)}
              className={errors.recipientName ? "border-red-500" : ""}
            />
            {errors.recipientName && (
              <p className="text-sm text-red-500">{errors.recipientName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientPhone">Nomor Telepon *</Label>
            <Input
              id="recipientPhone"
              type="tel"
              placeholder="+62 atau 0812345678"
              value={formData.recipientPhone}
              onChange={(e) => onInputChange("recipientPhone", e.target.value)}
              className={errors.recipientPhone ? "border-red-500" : ""}
            />
            {errors.recipientPhone && (
              <p className="text-sm text-red-500">{errors.recipientPhone}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipientInfoCard;
