# 🖥️ REKT JUDGE - Human Validation Terminal

> Terminal-style interface for validating participants and managing events on Stellar blockchain.

## 🎨 Design

This interface is inspired by **rekt.news** aesthetic:
- Terminal/hacker theme with green text on black background
- Glitch effects on titles
- Scanline overlay for CRT monitor effect
- Monospace fonts (Courier New)
- Matrix-style animations

## 🚀 Quick Start

### Prerequisites

1. **Freighter Wallet** - Install the browser extension:
   - Chrome/Brave: [Chrome Web Store](https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk)
   - Firefox: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/freighter/)

2. **Admin Account** - You need the admin wallet:
   ```
   Address: GDL5432N2JCCAZBHG7EKHHVBRG2XQUI2WJGSRBK4R5OF3QNCOMDKZBEW
   ```

### Installation

1. Clone or download the files
2. Open `index.html` in a web browser
3. Make sure you have a local web server running (or use Live Server in VS Code)

**OR** serve with Python:

```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

### First Run

1. **Connect Wallet**
   - Click "CONNECT_ADMIN_WALLET" button
   - Approve Freighter wallet connection
   - Only the admin address can access the terminal

2. **View Dashboard**
   - Stats show total/validated/pending participants
   - Navigate between GALLERY, EVENTS, and SYSTEM_LOGS tabs

3. **Validate Participants**
   - Go to GALLERY tab
   - Click on images to view full size
   - Use VALIDATE (✓) or REJECT (✗) buttons
   - Filter by ALL, VALIDATED, or PENDING

4. **Create Events**
   - Go to EVENTS tab
   - Click "CREATE_EVENT"
   - Enter event name
   - Select validated participants
   - Submit to create event on-chain

5. **Monitor Activity**
   - SYSTEM_LOGS tab shows all operations
   - Toast notifications appear for important actions
   - Transaction hashes are logged

## 📁 File Structure

```
app/
├── index.html           # Main HTML structure
├── styles.css           # Terminal/hacker theme styles
├── config.js            # Contract addresses & settings
├── contractService.js   # Stellar smart contract integration
├── app.js              # Application logic & UI handlers
└── README.md           # This file
```

## 🔧 Configuration

Edit `config.js` to change settings:

```javascript
const CONFIG = {
    NETWORK: 'testnet',
    RPC_URL: 'https://soroban-testnet.stellar.org',
    CONTRACT_ID: 'CCHFGFX3S52UX46HZEBEGW5N2LDDYMSJDLZF4CQOZ6TSWWKFEG4TFPLS',
    ADMIN_ADDRESS: 'GDL5432N2JCCAZBHG7EKHHVBRG2XQUI2WJGSRBK4R5OF3QNCOMDKZBEW',
    IPFS_GATEWAY: 'https://gateway.pinata.cloud/ipfs/',
    EXPLORER_URL: 'https://stellar.expert/explorer/testnet'
};
```

## 🎯 Features

### ✅ Participant Management
- View all registered participants
- See participant photos from IPFS
- Validate or reject participants
- Real-time status updates
- Filter by validation status

### 🎪 Event Management
- Create events with validated participants
- Select multiple participants
- View all created events
- Track participant count per event

### 📊 Dashboard
- Live statistics
- Total humans registered
- Validated count
- Pending validations
- Total events created

### 🔐 Security
- Admin-only access
- Freighter wallet integration
- Transaction signing
- On-chain validation

### 🎨 UI/UX
- Terminal aesthetic
- Glitch effects
- Scanline overlay
- Toast notifications
- Modal image viewer
- System activity logs

## 🔌 Smart Contract Functions Used

| Function | Description | Auth |
|----------|-------------|------|
| `get_admin()` | Get admin address | No |
| `get_all_humans(start, limit)` | Get paginated humans | No |
| `get_validated_humans()` | Get only validated | No |
| `update_human_validation(addr, bool)` | Validate/reject | ✅ Admin |
| `create_event(name, addresses[])` | Create event | ✅ Admin |
| `get_events(start, limit)` | Get events list | No |
| `distribute_to_event(id, token, pool)` | Distribute funds | ✅ Admin |

## 🐛 Troubleshooting

### "Freighter wallet not detected"
- Install Freighter browser extension
- Refresh the page

### "ACCESS_DENIED: Not authorized as admin"
- Make sure you're using the correct admin wallet
- Check the address in Freighter matches CONFIG.ADMIN_ADDRESS

### Images not loading
- Check IPFS gateway is accessible
- Verify IPFS hashes are correct
- Try a different IPFS gateway in config.js

### Transaction failed
- Check network connection
- Ensure sufficient XLM for gas fees
- Verify contract is deployed on testnet

### Empty gallery
- Wait for participants to register
- Check RPC_URL is accessible
- View browser console for errors

## 🌐 Network Info

- **Network:** Stellar Testnet
- **RPC:** https://soroban-testnet.stellar.org
- **Contract:** `CCHFGFX3S52UX46HZEBEGW5N2LDDYMSJDLZF4CQOZ6TSWWKFEG4TFPLS`
- **Explorer:** https://stellar.expert/explorer/testnet

## 📱 Browser Support

- ✅ Chrome/Brave (recommended)
- ✅ Firefox
- ✅ Edge
- ⚠️ Safari (limited Freighter support)

## 🔒 Security Notes

- Never share your admin private key
- Always verify transactions in Freighter before signing
- Check contract addresses match before transactions
- Use testnet for development/testing only

## 🎨 Customization

### Change Theme Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --terminal-green: #00ff41;  /* Main accent color */
    --bg-primary: #0a0a0a;      /* Background */
    --text-primary: #00ff41;    /* Text color */
}
```

### Adjust Glitch Effect

Modify `.glitch` class animation duration:

```css
.glitch {
    animation: glitch 3s infinite; /* Change 3s */
}
```

### Disable Scanlines

Remove or comment out in `styles.css`:

```css
body::before {
    /* Scanline effect - comment out to disable */
}
```

## 📚 Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [Freighter Wallet](https://www.freighter.app/)
- [rekt.news](https://rekt.news/) - Design inspiration

## 🚀 Production Deployment

For production:

1. Change `NETWORK` to `'public'` in config.js
2. Update `RPC_URL` to mainnet
3. Update `NETWORK_PASSPHRASE` to mainnet
4. Deploy to HTTPS hosting
5. Test thoroughly on testnet first!

## 📄 License

MIT License - Feel free to use and modify!

---

**Built with 💚 for ETHGlobal Buenos Aires 2025**

*"REKT? Not anymore."*
