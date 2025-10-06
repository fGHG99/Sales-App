import React from "react";
import { Building2 } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

const AddressLabelInput = ({ value, onChange, error }) => {
  return (
    <Card className="w-full md:w-[700px] lg:w-[900px]">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Label Alamat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="label">Label Alamat *</Label>
          <Input
            id="label"
            type="text"
            placeholder="Contoh: Rumah, Kantor, Apartemen, dll"
            value={value}
            onChange={onChange}
            className={error ? "border-red-500" : ""}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressLabelInput;
