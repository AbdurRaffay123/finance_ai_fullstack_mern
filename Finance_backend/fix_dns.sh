#!/bin/bash

echo "🔧 MongoDB Atlas DNS Fix Script"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script needs sudo privileges to change DNS settings"
    echo "   Run: sudo bash fix_dns.sh"
    exit 1
fi

echo "📋 Current DNS Configuration:"
cat /etc/systemd/resolved.conf | grep -E "^DNS|^FallbackDNS" || echo "   Using default DNS"
echo ""

echo "🔧 Option 1: Change to Google DNS (Recommended)"
echo "   This will update your system DNS to use Google DNS (8.8.8.8)"
echo ""
read -p "Apply Google DNS fix? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Backup original config
    cp /etc/systemd/resolved.conf /etc/systemd/resolved.conf.backup
    
    # Update DNS config
    if grep -q "^DNS=" /etc/systemd/resolved.conf; then
        sed -i 's/^DNS=.*/DNS=8.8.8.8 8.8.4.4/' /etc/systemd/resolved.conf
    else
        echo "DNS=8.8.8.8 8.8.4.4" >> /etc/systemd/resolved.conf
    fi
    
    # Restart DNS service
    systemctl restart systemd-resolved
    
    echo "✅ DNS updated to Google DNS (8.8.8.8)"
    echo "   Restarting DNS service..."
    sleep 2
    
    echo ""
    echo "🧪 Testing DNS resolution..."
    nslookup cluster0.hhyudfz.mongodb.net 8.8.8.8 | head -5
    
    echo ""
    echo "✅ DNS fix applied! Try restarting your backend server:"
    echo "   cd Finance_backend && npm run dev"
else
    echo "❌ DNS fix cancelled"
    echo ""
    echo "💡 Manual Fix Options:"
    echo "   1. Edit /etc/systemd/resolved.conf"
    echo "   2. Add: DNS=8.8.8.8 8.8.4.4"
    echo "   3. Run: sudo systemctl restart systemd-resolved"
    echo ""
    echo "   4. OR check MongoDB Atlas Dashboard to ensure cluster is running"
    echo "   5. OR use VPN if network blocks MongoDB"
fi



