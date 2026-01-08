# 🔧 MongoDB Atlas Connection Fix Guide

## Problem Identified

**Error**: `queryTxt ETIMEOUT cluster0.hhyudfz.mongodb.net`

**Root Cause**: DNS TXT record lookup is timing out. This is typically caused by:
- Network/DNS server blocking TXT queries
- Firewall blocking MongoDB Atlas DNS records
- ISP/Network provider restrictions
- MongoDB Atlas DNS service issue

## ✅ Quick Fixes

### Solution 1: Change DNS Server (Recommended)

Update your system DNS to use Google DNS or Cloudflare DNS:

**For Linux (Ubuntu/Debian):**
```bash
# Edit DNS configuration
sudo nano /etc/systemd/resolved.conf

# Add or modify:
[Resolve]
DNS=8.8.8.8 8.8.4.4
# OR use Cloudflare:
# DNS=1.1.1.1 1.0.0.1

# Restart DNS service
sudo systemctl restart systemd-resolved
```

**For temporary test:**
```bash
# Test with Google DNS
sudo systemd-resolve --set-dns=8.8.8.8 --interface=wlan0
# Replace wlan0 with your network interface name
```

### Solution 2: Use Standard Connection String (Alternative)

If SRV connection fails, try using the standard connection string format:

1. Go to MongoDB Atlas Dashboard: https://cloud.mongodb.com/
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"4.1 or later"**
5. Copy the connection string
6. Replace `<password>` with your actual password
7. Update `.env` file with the new connection string

### Solution 3: Check MongoDB Atlas Cluster Status

1. **Login to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Check Cluster Status**:
   - Ensure cluster is **running** (not paused)
   - Free tier clusters auto-pause after 1 hour of inactivity
   - Click **"Resume"** if paused
3. **Verify Network Access**:
   - Go to **Network Access** → **IP Access List**
   - Ensure your IP is whitelisted OR add `0.0.0.0/0` (allows all IPs)
4. **Verify Database User**:
   - Go to **Database Access** → Check user exists and has correct password

### Solution 4: Use VPN (If Network Blocks MongoDB)

If your network/ISP is blocking MongoDB Atlas:
- Use a VPN service
- Connect to VPN
- Restart backend server

### Solution 5: Test Connection Manually

Run the diagnostic script:
```bash
cd Finance_backend
node test_mongodb_connection.js
```

## 🔍 Verification Steps

1. **Test DNS Resolution**:
   ```bash
   nslookup cluster0.hhyudfz.mongodb.net
   dig cluster0.hhyudfz.mongodb.net TXT
   ```

2. **Test MongoDB Connection**:
   ```bash
   cd Finance_backend
   node test_mongodb_connection.js
   ```

3. **Check Network Connectivity**:
   ```bash
   curl -I https://cloud.mongodb.com/
   ```

## 📝 Updated Connection String Format

If you need to use standard format (non-SRV):

**Current (SRV - failing)**:
```
mongodb+srv://username:password@cluster0.hhyudfz.mongodb.net/database?retryWrites=true&w=majority
```

**Alternative (Standard - if SRV fails)**:
```
mongodb://username:password@cluster0-shard-00-00.hhyudfz.mongodb.net:27017,cluster0-shard-00-01.hhyudfz.mongodb.net:27017,cluster0-shard-00-02.hhyudfz.mongodb.net:27017/database?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

**To get standard connection string:**
1. MongoDB Atlas Dashboard → Your Cluster → Connect
2. Choose "Connect your application"
3. Select "I don't have MongoDB Compass"
4. Look for "Standard connection string" option

## 🚀 After Fixing

1. **Restart Backend Server**:
   ```bash
   cd Finance_backend
   npm run dev
   ```

2. **Verify Connection**:
   Look for: `✅ MongoDB Atlas connected successfully`

3. **Test API**:
   ```bash
   curl http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

## 📞 Still Having Issues?

1. **Check MongoDB Atlas Status**: https://status.mongodb.com/
2. **MongoDB Atlas Support**: https://www.mongodb.com/support
3. **Network Admin**: Contact your network administrator if on corporate network


