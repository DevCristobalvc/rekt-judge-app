/**
 * Stellar Contract Service
 * Handles all interactions with the Event Distributor smart contract
 */

// Import Stellar SDK via CDN (add to HTML if not using build tool)
// <script src="https://cdn.jsdelivr.net/npm/@stellar/stellar-sdk@11/dist/stellar-sdk.min.js"></script>

const ContractService = (() => {
    const StellarSdk = window.StellarSdk;
    const server = new StellarSdk.SorobanRpc.Server(CONFIG.RPC_URL);
    const contract = new StellarSdk.Contract(CONFIG.CONTRACT_ID);

    // Dummy account for read-only operations
    const DUMMY_ACCOUNT = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

    /**
     * Connect admin wallet via Freighter
     */
    async function connectAdminWallet() {
        if (!window.freighter) {
            throw new Error('FREIGHTER_NOT_INSTALLED: Please install Freighter wallet extension');
        }

        const publicKey = await window.freighter.getPublicKey();
        
        if (publicKey !== CONFIG.ADMIN_ADDRESS) {
            throw new Error('ACCESS_DENIED: Not authorized as admin');
        }

        return publicKey;
    }

    /**
     * Check if address is admin
     */
    async function isAdmin(address) {
        try {
            const account = await server.getAccount(DUMMY_ACCOUNT);
            
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: CONFIG.NETWORK_PASSPHRASE
            })
                .addOperation(contract.call('get_admin'))
                .setTimeout(180)
                .build();

            const result = await server.simulateTransaction(transaction);
            
            if (result.results?.[0]?.retval) {
                const adminAddress = StellarSdk.scValToNative(result.results[0].retval);
                return adminAddress === address;
            }
            
            return false;
        } catch (error) {
            console.error('Error checking admin:', error);
            return false;
        }
    }

    /**
     * Get all humans with pagination
     */
    async function getAllHumans(start = 0, limit = 100) {
        try {
            const account = await server.getAccount(DUMMY_ACCOUNT);
            
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: CONFIG.NETWORK_PASSPHRASE
            })
                .addOperation(
                    contract.call(
                        'get_all_humans',
                        StellarSdk.nativeToScVal(start, { type: 'u32' }),
                        StellarSdk.nativeToScVal(limit, { type: 'u32' })
                    )
                )
                .setTimeout(180)
                .build();

            const result = await server.simulateTransaction(transaction);
            
            if (result.results?.[0]?.retval) {
                const vec = result.results[0].retval.value();
                
                return vec.map(item => {
                    const values = item.value();
                    return {
                        address: StellarSdk.scValToNative(values[0]),
                        imageData: StellarSdk.scValToNative(values[1]), // Base64 string from contract
                        validated: StellarSdk.scValToNative(values[2])
                    };
                });
            }
            
            return [];
        } catch (error) {
            console.error('Error getting humans:', error);
            throw error;
        }
    }

    /**
     * Get only validated humans
     */
    async function getValidatedHumans() {
        try {
            const account = await server.getAccount(DUMMY_ACCOUNT);
            
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: CONFIG.NETWORK_PASSPHRASE
            })
                .addOperation(contract.call('get_validated_humans'))
                .setTimeout(180)
                .build();

            const result = await server.simulateTransaction(transaction);
            
            if (result.results?.[0]?.retval) {
                const vec = result.results[0].retval.value();
                return vec.map(addr => StellarSdk.scValToNative(addr));
            }
            
            return [];
        } catch (error) {
            console.error('Error getting validated humans:', error);
            throw error;
        }
    }

    /**
     * Update human validation status
     */
    async function updateHumanValidation(adminAddress, humanAddress, validated) {
        try {
            const sourceAccount = await server.getAccount(adminAddress);
            
            const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: CONFIG.NETWORK_PASSPHRASE
            })
                .addOperation(
                    contract.call(
                        'update_human_validation',
                        new StellarSdk.Address(humanAddress).toScVal(),
                        StellarSdk.nativeToScVal(validated, { type: 'bool' })
                    )
                )
                .setTimeout(180)
                .build();

            const preparedTx = await server.prepareTransaction(transaction);
            
            const signedXDR = await window.freighter.signTransaction(
                preparedTx.toXDR(),
                {
                    network: CONFIG.NETWORK === 'testnet' ? 'TESTNET' : 'PUBLIC',
                    networkPassphrase: CONFIG.NETWORK_PASSPHRASE
                }
            );
            
            const txFromXDR = StellarSdk.TransactionBuilder.fromXDR(
                signedXDR,
                CONFIG.NETWORK_PASSPHRASE
            );
            
            const sendResponse = await server.sendTransaction(txFromXDR);
            
            // Wait for confirmation
            let txStatus = await server.getTransaction(sendResponse.hash);
            let attempts = 0;
            
            while (txStatus.status === 'NOT_FOUND' && attempts < 30) {
                await sleep(1000);
                txStatus = await server.getTransaction(sendResponse.hash);
                attempts++;
            }
            
            if (txStatus.status === 'SUCCESS') {
                return {
                    txHash: sendResponse.hash,
                    status: 'success',
                    validated
                };
            }
            
            throw new Error(`Transaction failed: ${txStatus.status}`);
            
        } catch (error) {
            console.error('Error updating validation:', error);
            throw error;
        }
    }

    /**
     * Create a new event
     */
    async function createEvent(adminAddress, eventName, participantAddresses) {
        try {
            const sourceAccount = await server.getAccount(adminAddress);
            
            // Convert addresses to ScVal
            const addressesScVal = StellarSdk.nativeToScVal(
                participantAddresses.map(addr => new StellarSdk.Address(addr)),
                { type: 'Vec' }
            );
            
            const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: CONFIG.NETWORK_PASSPHRASE
            })
                .addOperation(
                    contract.call(
                        'create_event',
                        StellarSdk.nativeToScVal(eventName, { type: 'string' }),
                        addressesScVal
                    )
                )
                .setTimeout(180)
                .build();

            const preparedTx = await server.prepareTransaction(transaction);
            
            const signedXDR = await window.freighter.signTransaction(
                preparedTx.toXDR(),
                {
                    network: CONFIG.NETWORK === 'testnet' ? 'TESTNET' : 'PUBLIC',
                    networkPassphrase: CONFIG.NETWORK_PASSPHRASE
                }
            );
            
            const txFromXDR = StellarSdk.TransactionBuilder.fromXDR(
                signedXDR,
                CONFIG.NETWORK_PASSPHRASE
            );
            
            const sendResponse = await server.sendTransaction(txFromXDR);
            
            // Wait for confirmation
            let txStatus = await server.getTransaction(sendResponse.hash);
            let attempts = 0;
            
            while (txStatus.status === 'NOT_FOUND' && attempts < 30) {
                await sleep(1000);
                txStatus = await server.getTransaction(sendResponse.hash);
                attempts++;
            }
            
            if (txStatus.status === 'SUCCESS') {
                const eventId = StellarSdk.scValToNative(txStatus.returnValue);
                
                return {
                    eventId,
                    txHash: sendResponse.hash,
                    status: 'success'
                };
            }
            
            throw new Error(`Transaction failed: ${txStatus.status}`);
            
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }

    /**
     * Get events with pagination
     */
    async function getEvents(start = 0, limit = 50) {
        try {
            const account = await server.getAccount(DUMMY_ACCOUNT);
            
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: CONFIG.NETWORK_PASSPHRASE
            })
                .addOperation(
                    contract.call(
                        'get_events',
                        StellarSdk.nativeToScVal(start, { type: 'u32' }),
                        StellarSdk.nativeToScVal(limit, { type: 'u32' })
                    )
                )
                .setTimeout(180)
                .build();

            const result = await server.simulateTransaction(transaction);
            
            if (result.results?.[0]?.retval) {
                const vec = result.results[0].retval.value();
                
                return vec.map(item => {
                    const values = item.value();
                    return {
                        id: StellarSdk.scValToNative(values[0]),
                        name: StellarSdk.scValToNative(values[1]),
                        participants: StellarSdk.scValToNative(values[2])
                    };
                });
            }
            
            return [];
        } catch (error) {
            console.error('Error getting events:', error);
            throw error;
        }
    }

    /**
     * Distribute funds to event participants
     */
    async function distributeToEvent(adminAddress, eventId, tokenAddress, poolAmount) {
        try {
            const sourceAccount = await server.getAccount(adminAddress);
            
            const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: CONFIG.NETWORK_PASSPHRASE
            })
                .addOperation(
                    contract.call(
                        'distribute_to_event',
                        StellarSdk.nativeToScVal(eventId, { type: 'u32' }),
                        new StellarSdk.Address(tokenAddress).toScVal(),
                        StellarSdk.nativeToScVal(BigInt(poolAmount), { type: 'i128' })
                    )
                )
                .setTimeout(180)
                .build();

            const preparedTx = await server.prepareTransaction(transaction);
            
            const signedXDR = await window.freighter.signTransaction(
                preparedTx.toXDR(),
                {
                    network: CONFIG.NETWORK === 'testnet' ? 'TESTNET' : 'PUBLIC',
                    networkPassphrase: CONFIG.NETWORK_PASSPHRASE
                }
            );
            
            const txFromXDR = StellarSdk.TransactionBuilder.fromXDR(
                signedXDR,
                CONFIG.NETWORK_PASSPHRASE
            );
            
            const sendResponse = await server.sendTransaction(txFromXDR);
            
            // Wait for confirmation
            let txStatus = await server.getTransaction(sendResponse.hash);
            let attempts = 0;
            
            while (txStatus.status === 'NOT_FOUND' && attempts < 30) {
                await sleep(1000);
                txStatus = await server.getTransaction(sendResponse.hash);
                attempts++;
            }
            
            if (txStatus.status === 'SUCCESS') {
                return {
                    txHash: sendResponse.hash,
                    status: 'success',
                    explorerUrl: `${CONFIG.EXPLORER_URL}/tx/${sendResponse.hash}`
                };
            }
            
            throw new Error(`Distribution failed: ${txStatus.status}`);
            
        } catch (error) {
            console.error('Error distributing:', error);
            throw error;
        }
    }

    /**
     * Get contract statistics
     */
    async function getContractStats() {
        try {
            const allHumans = await getAllHumans(0, 1000);
            const validated = allHumans.filter(h => h.validated);
            const pending = allHumans.filter(h => !h.validated);
            const events = await getEvents(0, 1000);
            
            return {
                totalHumans: allHumans.length,
                validatedCount: validated.length,
                pendingCount: pending.length,
                totalEvents: events.length,
                validationRate: allHumans.length > 0 
                    ? (validated.length / allHumans.length * 100).toFixed(1)
                    : 0
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                totalHumans: 0,
                validatedCount: 0,
                pendingCount: 0,
                totalEvents: 0,
                validationRate: 0
            };
        }
    }

    /**
     * Get image data URL from base64 string stored in contract
     */
    function getImageDataUrl(imageData) {
        // If already has data URL prefix, return as is
        if (imageData.startsWith('data:')) {
            return imageData;
        }
        // Otherwise, add data URL prefix (assuming JPEG, but could detect type)
        return `data:image/jpeg;base64,${imageData}`;
    }

    /**
     * Helper: Sleep function
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public API
    return {
        connectAdminWallet,
        isAdmin,
        getAllHumans,
        getValidatedHumans,
        updateHumanValidation,
        createEvent,
        getEvents,
        distributeToEvent,
        getContractStats,
        getImageDataUrl
    };
})();
