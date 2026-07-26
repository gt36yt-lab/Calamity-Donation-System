//! # CalamityDonation — Soroban smart contract
//!
//! Accepts native XLM donations on the Stellar testnet, tracks per-donor
//! totals, and lets an authorised admin withdraw funds to the LGU treasury
//! wallet.
//!
//! ## Storage layout
//!
//! | Key                       | Type      | Description                       |
//! |---------------------------|-----------|-----------------------------------|
//! | `DataKey::Admin`          | `Address` | Contract deployer / LGU wallet    |
//! | `DataKey::Total`          | `i128`    | Cumulative stroops received       |
//! | `DataKey::DonorCount`     | `u32`     | Number of unique donors           |
//! | `DataKey::DonorTotal(a)`  | `i128`    | Per-donor cumulative stroops      |
//!
//! ## Entry-points
//!
//! | Function          | Auth     | Description                                   |
//! |-------------------|----------|-----------------------------------------------|
//! | `initialize`      | admin    | One-time setup; records admin address          |
//! | `donate`          | donor    | Transfer XLM into contract + record it         |
//! | `withdraw`        | admin    | Move XLM balance to any address                |
//! | `get_total`       | —        | Cumulative stroops received                    |
//! | `get_donor_total` | —        | One donor's cumulative stroops                 |
//! | `get_donor_count` | —        | Number of unique donors                        |
//! | `get_admin`       | —        | Admin address                                  |

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token::Client as TokenClient,
    Address, Env, String,
};

// ---------------------------------------------------------------------------
// The Stellar native XLM token contract has a fixed, well-known address on
// every Soroban network.  It is derived from the asset "native" and is the
// same value across testnet and mainnet because it's computed from the asset
// descriptor alone, not from a network-specific seed.
//
// stellar-sdk produces this via Asset.native().contractId(networkPassphrase),
// which resolves to the constant below on both testnet and mainnet.
// ---------------------------------------------------------------------------
const NATIVE_TOKEN_ADDRESS: &str =
    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// ---------------------------------------------------------------------------
// Storage key enum
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Total,
    DonorCount,
    DonorTotal(Address),
}

// ---------------------------------------------------------------------------
// Event payloads (emitted for off-chain indexers and the frontend)
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub struct DonationEvent {
    /// Donating address.
    pub donor: Address,
    /// Stroops transferred in this call (1 XLM = 10_000_000 stroops).
    pub amount: i128,
    /// Arbitrary memo (≤ 28 chars; longer strings are accepted but the
    /// Stellar memo field on the wrapping tx is independent).
    pub memo: String,
    /// New contract-wide cumulative total after this donation.
    pub running_total: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct WithdrawEvent {
    pub admin: Address,
    pub amount: i128,
    pub to: Address,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct CalamityDonation;

#[contractimpl]
impl CalamityDonation {
    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    /// One-time initialisation.  Call immediately after deployment.
    /// `admin` must sign — use the LGU treasury keypair.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialised");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Total, &0_i128);
        env.storage().instance().set(&DataKey::DonorCount, &0_u32);
        // ~30 days of TTL (ledger closes ~every 5 s → 518 400 ledgers ≈ 30 d)
        env.storage().instance().extend_ttl(518_400, 518_400);
    }

    // -----------------------------------------------------------------------
    // Donate
    // -----------------------------------------------------------------------

    /// Pull `amount` stroops of native XLM from `donor` into this contract.
    ///
    /// Freighter signs the transaction that invokes this entry-point.
    /// The token.transfer call requires an auth entry for the donor address,
    /// which Freighter produces automatically when the dApp calls
    /// `signTransaction`.
    pub fn donate(env: Env, donor: Address, amount: i128, memo: String) {
        donor.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        // Transfer native XLM from the donor into this contract.
        let token_addr =
            Address::from_string(&String::from_str(&env, NATIVE_TOKEN_ADDRESS));
        let token = TokenClient::new(&env, &token_addr);
        token.transfer(&donor, &env.current_contract_address(), &amount);

        // ---- Update per-donor persistent storage ----
        let donor_key = DataKey::DonorTotal(donor.clone());
        let prev_donor: i128 = env
            .storage()
            .persistent()
            .get(&donor_key)
            .unwrap_or(0_i128);

        if prev_donor == 0 {
            // First donation from this address → increment unique donor count.
            let count: u32 = env
                .storage()
                .instance()
                .get(&DataKey::DonorCount)
                .unwrap_or(0);
            env.storage()
                .instance()
                .set(&DataKey::DonorCount, &(count + 1));
        }

        let new_donor_total = prev_donor + amount;
        env.storage()
            .persistent()
            .set(&donor_key, &new_donor_total);
        // Keep donor record alive for ~30 days.
        env.storage()
            .persistent()
            .extend_ttl(&donor_key, 518_400, 518_400);

        // ---- Update global instance total ----
        let prev_total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Total)
            .unwrap_or(0_i128);
        let new_total = prev_total + amount;
        env.storage().instance().set(&DataKey::Total, &new_total);
        env.storage().instance().extend_ttl(518_400, 518_400);

        // ---- Emit donation event ----
        env.events().publish(
            (symbol_short!("donate"), donor.clone()),
            DonationEvent {
                donor,
                amount,
                memo,
                running_total: new_total,
            },
        );
    }

    // -----------------------------------------------------------------------
    // Withdraw  (admin only)
    // -----------------------------------------------------------------------

    /// Transfer `amount` stroops to `to`.  Pass `amount = 0` to sweep the
    /// entire contract balance.  Only the admin address (set at initialise)
    /// may call this.
    pub fn withdraw(env: Env, amount: i128, to: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialised");
        admin.require_auth();

        let token_addr =
            Address::from_string(&String::from_str(&env, NATIVE_TOKEN_ADDRESS));
        let token = TokenClient::new(&env, &token_addr);

        let balance = token.balance(&env.current_contract_address());
        let send = if amount == 0 { balance } else { amount };

        if send <= 0 {
            panic!("nothing to withdraw");
        }
        if send > balance {
            panic!("insufficient contract balance");
        }

        token.transfer(&env.current_contract_address(), &to, &send);

        env.events().publish(
            (symbol_short!("withdraw"), admin.clone()),
            WithdrawEvent {
                admin,
                amount: send,
                to,
            },
        );
    }

    // -----------------------------------------------------------------------
    // Read-only views
    // -----------------------------------------------------------------------

    /// Cumulative stroops donated since deployment.
    pub fn get_total(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Total)
            .unwrap_or(0_i128)
    }

    /// Cumulative stroops donated by a single address.
    pub fn get_donor_total(env: Env, donor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::DonorTotal(donor))
            .unwrap_or(0_i128)
    }

    /// Number of unique donor addresses.
    pub fn get_donor_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::DonorCount)
            .unwrap_or(0)
    }

    /// The admin (LGU treasury) address.
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialised")
    }
}

// ---------------------------------------------------------------------------
// Unit tests  (run with: cargo test -p calamity-donation)
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::Address as _,
        token::{Client as TokenClient, StellarAssetClient},
        Env,
    };

    /// Deploys the contract, mints XLM to the donor, and returns
    /// (env, contract_client, token_client, admin, donor).
    fn setup() -> (
        Env,
        CalamityDonationClient<'static>,
        TokenClient<'static>,
        Address,
        Address,
    ) {
        // soroban_sdk test env is not Send/Sync so we heap-leak it for the lifetime.
        let env: &'static Env = Box::leak(Box::new(Env::default()));
        env.mock_all_auths();

        let admin = Address::generate(env);
        let donor = Address::generate(env);

        // Register the calamity-donation contract.
        let contract_id = env.register_contract(None, CalamityDonation);
        let client = CalamityDonationClient::new(env, &contract_id);

        // Register the native token contract so token.transfer works in tests.
        let token_id = env.register_stellar_asset_contract_v2(admin.clone());
        let token = TokenClient::new(env, token_id.address());
        let token_admin = StellarAssetClient::new(env, token_id.address());

        // Mint 1 000 XLM (= 10_000_000_000 stroops) to the donor.
        token_admin.mint(&donor, &10_000_000_000_i128);

        client.initialize(&admin);

        (env.clone(), client, token, admin, donor)
    }

    // NOTE: Because the native token address in tests is allocated dynamically
    // by `register_stellar_asset_contract_v2`, you'll need to override the
    // NATIVE_TOKEN_ADDRESS constant in an integration test harness.  The unit
    // tests below validate non-token logic paths; end-to-end donation flow is
    // best tested via `stellar contract invoke` on Testnet (see README).

    #[test]
    fn test_initialize_sets_admin_and_zeroes() {
        let (_, client, _, admin, _) = setup();
        assert_eq!(client.get_admin(), admin);
        assert_eq!(client.get_total(), 0);
        assert_eq!(client.get_donor_count(), 0);
    }

    #[test]
    #[should_panic(expected = "already initialised")]
    fn test_double_initialize_panics() {
        let (env, client, _, admin, _) = setup();
        // Second call must panic.
        client.initialize(&admin);
    }
}
