# 🚀 QUICK START

## Option 1: Using the start script (macOS/Linux)

```bash
./start-dev.sh
```

Then open: http://localhost:8000

## Option 2: Using Python directly

```bash
python3 -m http.server 8000
```

Then open: http://localhost:8000

## Option 3: Using VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Option 4: Direct browser (may have issues)

Simply open `index.html` in your browser

---

## 🧪 Testing

First, open the test page to verify everything works:

**http://localhost:8000/test.html**

This will check:
- ✅ JavaScript is working
- ✅ Stellar SDK loaded
- ✅ Freighter wallet installed
- ✅ Config loaded
- ✅ RPC connection working

## 🎮 Using the App

1. **Install Freighter Wallet**
   - Chrome/Brave: https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/freighter/

2. **Import Admin Wallet**
   - Open Freighter
   - Import wallet with admin private key
   - Make sure address is: `GDL5432N2JCCAZBHG7EKHHVBRG2XQUI2WJGSRBK4R5OF3QNCOMDKZBEW`

3. **Open Main App**
   - Go to: http://localhost:8000
   - Click "CONNECT_ADMIN_WALLET"
   - Approve Freighter connection

4. **Start Validating**
   - View participants in GALLERY tab
   - Click images to view full size
   - Use VALIDATE or REJECT buttons
   - Create events in EVENTS tab
   - Monitor activity in SYSTEM_LOGS tab

---

## 📦 Files Overview

```
├── index.html           # Main application
├── test.html            # Test/debug page
├── styles.css           # Terminal theme styles
├── app.js              # Application logic
├── contractService.js   # Stellar contract integration
├── config.js           # Configuration
├── start-dev.sh        # Development server script
└── README.md           # Full documentation
```

---

## 🐛 Troubleshooting

### Port 8000 already in use?

Try a different port:
```bash
python3 -m http.server 8080
```

### Freighter not detected?

1. Install the extension
2. Refresh the page
3. Check browser console for errors

### Images not loading?

- Check IPFS gateway in config.js
- Wait a few seconds for IPFS to load
- Try reloading the page

---

## 🎨 Features

- ✅ Terminal/hacker aesthetic (rekt.news style)
- ✅ Glitch effects and CRT scanlines
- ✅ Real-time participant validation
- ✅ Event creation and management
- ✅ System activity logging
- ✅ Modal image viewer
- ✅ Toast notifications
- ✅ Filter by validation status

---

**Ready to REKT? Let's go! 🚀**
