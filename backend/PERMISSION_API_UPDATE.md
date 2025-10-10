# 🔐 Permission API - Role Connection Update

## 📝 Perubahan yang Dilakukan

Endpoint untuk manajemen **Access Permission** telah diupdate untuk mendukung koneksi langsung dengan **Role** menggunakan `roleIds` dalam request body.

---

## 🔄 API Endpoints yang Diupdate

### 1. **POST /support/permissions** - Create Permission dengan Role

**Request Body:**

```json
{
  "accessKey": "order.view",
  "roleIds": ["role-uuid-1", "role-uuid-2"] // OPTIONAL - Array of role IDs
}
```

**Response (Success 201):**

```json
{
  "success": true,
  "message": "Permission created successfully",
  "permission": {
    "id": "perm-uuid",
    "accessKey": "order.view",
    "isDeleted": false,
    "role": [
      {
        "id": "role-uuid-1",
        "name": "Admin",
        "roleType": "admin"
      },
      {
        "id": "role-uuid-2",
        "name": "SuperAdmin",
        "roleType": "superadmin"
      }
    ]
  }
}
```

**Validations:**

- ✅ `accessKey` adalah **required**
- ✅ `roleIds` adalah **optional** (bisa kosong atau tidak disertakan)
- ✅ Jika `roleIds` disertakan, semua role ID harus valid dan tidak deleted
- ✅ Permission dengan `accessKey` yang sama tidak boleh duplikat

**Error Responses:**

```json
// 400 - Validation Error
{
  "error": "Access key is required"
}

// 400 - Duplicate Permission
{
  "error": "Permission with this access key already exists"
}

// 400 - Invalid Role IDs
{
  "error": "One or more role IDs are invalid or deleted"
}
```

---

### 2. **PUT /support/permissions/:id** - Update Permission dan Role

**Request Body:**

```json
{
  "accessKey": "order.create", // REQUIRED - New access key
  "roleIds": ["role-uuid-3"] // OPTIONAL - Update role connections
}
```

**Behavior:**

- Jika `roleIds` **disertakan**: Replace semua koneksi role dengan yang baru (set)
- Jika `roleIds` **tidak disertakan**: Tidak mengubah koneksi role yang ada
- Jika `roleIds` adalah **array kosong []**: Hapus semua koneksi role

**Response (Success 200):**

```json
{
  "success": true,
  "message": "Permission updated successfully",
  "permission": {
    "id": "perm-uuid",
    "accessKey": "order.create",
    "isDeleted": false,
    "role": [
      {
        "id": "role-uuid-3",
        "name": "Courier",
        "roleType": "courier"
      }
    ]
  }
}
```

**Validations:**

- ✅ Permission harus exist dan tidak deleted
- ✅ `accessKey` baru tidak boleh duplikat dengan permission lain
- ✅ Semua `roleIds` harus valid dan tidak deleted

**Error Responses:**

```json
// 404 - Permission Not Found
{
  "error": "Permission not found"
}

// 400 - Duplicate Access Key
{
  "error": "Permission with this access key already exists"
}

// 400 - Invalid Role IDs
{
  "error": "One or more role IDs are invalid or deleted"
}
```

---

### 3. **GET /support/permissions** - List All Permissions

**Response (Success 200):**

```json
{
  "success": true,
  "permissions": [
    {
      "id": "perm-uuid-1",
      "accessKey": "support.role.view",
      "isDeleted": false,
      "role": [
        {
          "id": "role-uuid-1",
          "name": "IT Support",
          "roleType": "itsupport"
        }
      ]
    },
    {
      "id": "perm-uuid-2",
      "accessKey": "order.create",
      "isDeleted": false,
      "role": [] // Permission tanpa role
    }
  ]
}
```

**Perubahan:**

- ✅ Sekarang menampilkan `roleType` dalam relasi role
- ✅ Filter role yang deleted (`isDeleted: false`)
- ✅ Sorted by `accessKey` ascending

---

## 🎯 Use Cases

### **Use Case 1: Create Permission tanpa Role**

```bash
POST /support/permissions
{
  "accessKey": "product.delete"
}
```

Permission dibuat tanpa koneksi role. Bisa ditambahkan nanti via update.

---

### **Use Case 2: Create Permission dengan Multiple Roles**

```bash
POST /support/permissions
{
  "accessKey": "order.approve",
  "roleIds": ["admin-role-id", "superadmin-role-id"]
}
```

Permission langsung terhubung dengan Admin dan SuperAdmin role.

---

### **Use Case 3: Update Access Key Only**

```bash
PUT /support/permissions/{permissionId}
{
  "accessKey": "order.reject"
}
```

Hanya mengubah access key, role connections tetap sama.

---

### **Use Case 4: Update Role Connections Only**

```bash
PUT /support/permissions/{permissionId}
{
  "accessKey": "order.view",  // Tetap sama
  "roleIds": ["courier-role-id", "admin-role-id", "user-role-id"]
}
```

Replace semua role dengan yang baru.

---

### **Use Case 5: Remove All Role Connections**

```bash
PUT /support/permissions/{permissionId}
{
  "accessKey": "order.view",
  "roleIds": []  // Empty array = remove all
}
```

Permission tetap exist tapi tidak terhubung dengan role manapun.

---

## 🔒 Authorization

Semua endpoint memerlukan:

1. ✅ **Authentication**: Valid access token (Bearer token)
2. ✅ **Authorization**: IT Support permissions
   - `support.permission.view` untuk GET
   - `support.permission.create` untuk POST
   - `support.permission.update` untuk PUT

---

## 📊 Relasi Database

```
AccessPermission (Many) ←→ (Many) Role
```

**Many-to-Many Relationship:**

- Satu permission bisa dimiliki banyak role
- Satu role bisa memiliki banyak permissions
- Menggunakan implicit join table `_RolePermissions`

---

## ✅ Testing Examples

### **Test 1: Create Permission dengan Role**

```bash
curl -X POST http://localhost:3000/support/permissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accessKey": "invoice.generate",
    "roleIds": ["admin-role-id"]
  }'
```

### **Test 2: Update Permission Add More Roles**

```bash
curl -X PUT http://localhost:3000/support/permissions/{permId} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accessKey": "invoice.generate",
    "roleIds": ["admin-role-id", "superadmin-role-id"]
  }'
```

### **Test 3: Get All Permissions with Roles**

```bash
curl -X GET http://localhost:3000/support/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚀 Migration Notes

**Backward Compatibility:**

- ✅ Existing API calls tanpa `roleIds` masih berfungsi
- ✅ `roleIds` bersifat **optional** di semua endpoint
- ✅ Tidak ada breaking changes untuk client yang sudah ada

**Database:**

- ✅ Tidak perlu migration baru (relasi sudah ada di schema)
- ✅ Menggunakan existing many-to-many relation

---

## 📌 Best Practices

1. **Create Permission Workflow:**

   ```
   1. Create permission dengan accessKey
   2. (Optional) Connect dengan roleIds saat create
   3. Atau update nanti untuk menambahkan roles
   ```

2. **Update Permission Workflow:**

   ```
   1. Update accessKey jika perlu rename
   2. Update roleIds untuk add/remove role connections
   3. Use empty array [] untuk remove semua roles
   ```

3. **Role Assignment:**
   ```
   - Gunakan roleIds untuk quick assignment
   - Atau update role langsung via PUT /support/roles/:id dengan permissionIds
   - Kedua cara sama-sama valid (pilih yang lebih sesuai dengan use case)
   ```

---

## 🔧 Implementation Details

**Prisma Operations Used:**

```javascript
// Create with role connection
prisma.accessPermission.create({
  data: {
    accessKey: "...",
    role: {
      connect: roleIds.map((id) => ({ id })), // Many-to-many connect
    },
  },
});

// Update with role replacement
prisma.accessPermission.update({
  data: {
    accessKey: "...",
    role: {
      set: roleIds.map((id) => ({ id })), // Replace all connections
    },
  },
});
```

---

**Last Updated:** October 10, 2025
**API Version:** v1.0
