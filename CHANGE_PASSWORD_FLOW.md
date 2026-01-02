# 🔐 Change Password Feature - Complete Flow

## Request → Validation → Hash → Save → Response

### **1. User Initiates Password Change**
```
User navigates to: Settings → Security Tab
User fills form:
  - Current Password: "oldpass123"
  - New Password: "NewSecure@123"
  - Confirm Password: "NewSecure@123"
User clicks "Change Password"
```

### **2. Frontend Validation (Client-Side)**
```typescript
// src/components/ChangePassword.tsx
validateForm() {
  ✓ Check all fields filled
  ✓ Check new password length >= 8
  ✓ Check passwords match
  ✓ Check new password != current password
  ✓ Calculate password strength (weak/fair/good/strong)
}
```

### **3. API Request**
```typescript
// src/api.js
changePassword({
  currentPassword: "oldpass123",
  newPassword: "NewSecure@123",
  confirmPassword: "NewSecure@123"
})

// Request sent to: PUT /api/user/change-password
// Headers: Authorization: Bearer <JWT_TOKEN>
```

### **4. Backend Authentication**
```javascript
// Finance_backend/routes/changePassword.js
verifyToken() {
  ✓ Extract JWT from Authorization header
  ✓ Verify token with JWT_SECRET
  ✓ Decode user ID from token
  ✓ Attach user to request (req.user)
}
```

### **5. Backend Validation**
```javascript
// Finance_backend/routes/changePassword.js
✓ Check all fields provided
✓ Find user by ID from JWT
✓ Verify current password with bcrypt.compare()
✓ Check new password matches confirmation
✓ Validate password strength (utils/passwordValidator.js)
  - Length >= 8
  - Has uppercase
  - Has lowercase
  - Has number
  - Has special character
  - Not common password
  - Different from current password
```

### **6. Password Hashing**
```javascript
// Finance_backend/models/User.js
user.password = newPassword; // Set new password
await user.save(); // Triggers pre-save hook

// Pre-save hook:
userSchema.pre('save', async function() {
  ✓ Detect password modification
  ✓ Hash with bcrypt (12 salt rounds)
  ✓ Update passwordUpdatedAt timestamp
  ✓ Save hashed password
})
```

### **7. Database Update**
```javascript
// MongoDB Update
User.findByIdAndUpdate(userId, {
  password: "$2a$12$hashed_password_here",
  passwordUpdatedAt: ISODate("2024-01-15T10:30:00Z")
})
```

### **8. Success Response**
```json
{
  "message": "Password changed successfully",
  "success": true,
  "passwordUpdatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **9. Frontend Success Handling**
```typescript
// src/components/ChangePassword.tsx
✓ Show success message
✓ Clear form fields
✓ Reset password strength indicator
✓ Optional: Log out user for security
```

---

## 🔒 Security Layers

### **Layer 1: Frontend Validation**
- Immediate user feedback
- Password strength indicator
- Client-side checks

### **Layer 2: Authentication**
- JWT token required
- Token verification
- User identification

### **Layer 3: Authorization**
- Current password verification
- User ownership check

### **Layer 4: Password Validation**
- Strength requirements
- Common password check
- Reuse prevention

### **Layer 5: Hashing**
- Bcrypt with 12 salt rounds
- One-way encryption
- Secure storage

### **Layer 6: Database**
- Hashed password only
- Timestamp tracking
- No plaintext storage

---

## ⚠️ Error Scenarios

### **Scenario 1: Invalid Token**
```
Request → verifyToken() → 401 Unauthorized
Response: { "message": "Invalid or expired token" }
```

### **Scenario 2: Wrong Current Password**
```
Request → matchPassword() → false
Response: 401 { "message": "Current password is incorrect" }
```

### **Scenario 3: Weak Password**
```
Request → validatePassword() → Invalid
Response: 400 { 
  "message": "Password does not meet security requirements",
  "errors": { "newPassword": ["Password must contain..."] }
}
```

### **Scenario 4: Password Mismatch**
```
Request → newPassword !== confirmPassword
Response: 400 { "message": "Passwords do not match" }
```

---

## ✅ Success Criteria

- ✓ User can change password successfully
- ✓ Current password is verified
- ✓ New password meets strength requirements
- ✓ Password is securely hashed
- ✓ Database is updated
- ✓ User receives clear feedback
- ✓ No sensitive information exposed
- ✓ All security best practices followed
