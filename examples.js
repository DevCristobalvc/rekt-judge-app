/**
 * USAGE EXAMPLES
 * How to use the ContractService in browser console
 */

// ============================================
// 1. CONNECT ADMIN WALLET
// ============================================

// Connect and verify admin access
const adminAddress = await ContractService.connectAdminWallet();
console.log('Connected as:', adminAddress);

const isAdminUser = await ContractService.isAdmin(adminAddress);
console.log('Is Admin?:', isAdminUser);


// ============================================
// 2. GET ALL PARTICIPANTS
// ============================================

// Get first 20 participants
const participants = await ContractService.getAllHumans(0, 20);
console.log('Participants:', participants);

// Example output:
// [
//   {
//     address: "GABC...",
//     ipfsHash: "QmXYZ...",
//     validated: false
//   },
//   ...
// ]


// ============================================
// 3. GET ONLY VALIDATED HUMANS
// ============================================

const validated = await ContractService.getValidatedHumans();
console.log('Validated humans:', validated);

// Example output:
// ["GABC...", "GDEF...", "GHIJ..."]


// ============================================
// 4. VALIDATE A PARTICIPANT
// ============================================

// Validate (approve) a participant
const participantAddress = "GABC..."; // Replace with actual address
const result = await ContractService.updateHumanValidation(
    adminAddress,
    participantAddress,
    true  // true = validate, false = reject
);

console.log('Validation result:', result);
// Output: { txHash: "abc123...", status: "success", validated: true }


// ============================================
// 5. REJECT A PARTICIPANT
// ============================================

const rejectResult = await ContractService.updateHumanValidation(
    adminAddress,
    participantAddress,
    false  // Reject
);

console.log('Rejection result:', rejectResult);


// ============================================
// 6. CREATE AN EVENT
// ============================================

// Get validated humans first
const validatedAddresses = await ContractService.getValidatedHumans();

// Create event with some of them
const eventResult = await ContractService.createEvent(
    adminAddress,
    "ETHGlobal Buenos Aires 2025",  // Event name
    validatedAddresses.slice(0, 10)  // First 10 validated humans
);

console.log('Event created:', eventResult);
// Output: { eventId: 1, txHash: "xyz789...", status: "success" }


// ============================================
// 7. GET ALL EVENTS
// ============================================

const events = await ContractService.getEvents(0, 50);
console.log('Events:', events);

// Example output:
// [
//   {
//     id: 1,
//     name: "ETHGlobal BA 2025",
//     participants: ["GABC...", "GDEF..."]
//   },
//   ...
// ]


// ============================================
// 8. GET CONTRACT STATISTICS
// ============================================

const stats = await ContractService.getContractStats();
console.log('Stats:', stats);

// Example output:
// {
//   totalHumans: 50,
//   validatedCount: 30,
//   pendingCount: 20,
//   totalEvents: 5,
//   validationRate: "60.0"
// }


// ============================================
// 9. GET IPFS IMAGE URL
// ============================================

const ipfsHash = "QmXYZ123...";
const imageUrl = ContractService.getIPFSUrl(ipfsHash);
console.log('Image URL:', imageUrl);

// Open image in new tab
window.open(imageUrl, '_blank');


// ============================================
// 10. DISTRIBUTE FUNDS TO EVENT (Advanced)
// ============================================

// Note: Make sure you've approved the token first!
const eventId = 1;
const tokenAddress = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; // USDC testnet
const poolAmount = "1000000000"; // 100 USDC (7 decimals)

const distributeResult = await ContractService.distributeToEvent(
    adminAddress,
    eventId,
    tokenAddress,
    poolAmount
);

console.log('Distribution result:', distributeResult);
// Output: { txHash: "...", status: "success", explorerUrl: "https://..." }


// ============================================
// BATCH VALIDATION EXAMPLE
// ============================================

// Validate multiple participants
async function validateBatch(addresses) {
    const results = [];
    
    for (const address of addresses) {
        try {
            console.log(`Validating ${address}...`);
            
            const result = await ContractService.updateHumanValidation(
                adminAddress,
                address,
                true
            );
            
            results.push({ address, success: true, result });
            console.log(`✅ Validated: ${address}`);
            
            // Wait 2 seconds between transactions
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            results.push({ address, success: false, error: error.message });
            console.error(`❌ Failed: ${address}`, error.message);
        }
    }
    
    return results;
}

// Usage:
// const participants = await ContractService.getAllHumans(0, 100);
// const pending = participants.filter(p => !p.validated).map(p => p.address);
// const results = await validateBatch(pending.slice(0, 5)); // Validate first 5


// ============================================
// FILTER AND SEARCH EXAMPLES
// ============================================

// Get all participants and filter
const allHumans = await ContractService.getAllHumans(0, 1000);

// Find by address
const findByAddress = (address) => {
    return allHumans.find(h => h.address === address);
};

// Filter pending
const pending = allHumans.filter(h => !h.validated);
console.log(`Pending validations: ${pending.length}`);

// Filter validated
const approved = allHumans.filter(h => h.validated);
console.log(`Validated humans: ${approved.length}`);

// Sort by validation status
const sorted = [...allHumans].sort((a, b) => {
    if (a.validated === b.validated) return 0;
    return a.validated ? -1 : 1; // Validated first
});


// ============================================
// ERROR HANDLING EXAMPLES
// ============================================

// Proper error handling
async function safeValidation(address, validated) {
    try {
        const result = await ContractService.updateHumanValidation(
            adminAddress,
            address,
            validated
        );
        
        return { success: true, result };
        
    } catch (error) {
        console.error('Validation failed:', error);
        
        // Check specific errors
        if (error.message.includes('HumanNotFound')) {
            return { success: false, error: 'Participant not registered' };
        }
        
        if (error.message.includes('ACCESS_DENIED')) {
            return { success: false, error: 'Not authorized as admin' };
        }
        
        if (error.message.includes('User declined')) {
            return { success: false, error: 'User rejected transaction' };
        }
        
        return { success: false, error: error.message };
    }
}


// ============================================
// MONITORING EXAMPLES
// ============================================

// Monitor contract state
async function monitorContract() {
    console.log('=== Contract Monitor ===');
    
    const stats = await ContractService.getContractStats();
    console.log(`Total Humans: ${stats.totalHumans}`);
    console.log(`Validated: ${stats.validatedCount} (${stats.validationRate}%)`);
    console.log(`Pending: ${stats.pendingCount}`);
    console.log(`Events: ${stats.totalEvents}`);
    
    const humans = await ContractService.getAllHumans(0, 10);
    console.log('\nRecent Participants:');
    humans.forEach((h, i) => {
        const status = h.validated ? '✅' : '⏳';
        console.log(`${i + 1}. ${status} ${h.address.slice(0, 8)}...`);
    });
}

// Run every 30 seconds
// setInterval(monitorContract, 30000);


// ============================================
// EXPORT DATA EXAMPLES
// ============================================

// Export all data to JSON
async function exportData() {
    const data = {
        timestamp: new Date().toISOString(),
        stats: await ContractService.getContractStats(),
        participants: await ContractService.getAllHumans(0, 1000),
        validated: await ContractService.getValidatedHumans(),
        events: await ContractService.getEvents(0, 100)
    };
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekt-judge-export-${Date.now()}.json`;
    a.click();
    
    console.log('Data exported!');
}

// Usage: await exportData();
