//! # CalamityDonation — Soroban smart contract (v2, SDK 27)
//!
//! ## Architecture
//!
//! The contract records donations that are sent to the LGU wallet via a
//! classic XLM Payment operation in the *same* transaction as
//! `record_donation`.  The contract never moves tokens itself, eliminating
//! SAC sub-invocation auth entries and the nonce-expiry problems they cause.
//!
//! ## Storage layout
//!
//! | Key                      | Type      | TTL policy   | Description                  |
//! |--------------------------|-----------|--------------|------------------------------|
//! | `DataKey::Admin`         | `Address` | instance     | LGU treasury / admin         |
//! | `DataKey::Total`         | `i128`    | instance     | Cumulative stroops recorded  |
//! | `DataKey::DonorCount`    | `u32`     | instance     | Unique donor count           |
//! | `DataKey::DonorTotal(a)` | `i128`    | persistent   | Per-donor cumulative stroops |
//!
//! ## Entry-points
//!
//! | Function           | Auth  | Description                              |
//! |--------------------|-------|------------------------------------------|
//! | `__constructor`    | admin | Atomic init at deploy time (CAP-0058)    |
//! | `record_donation`  | donor | Log a donation (no token movement)       |
//! | `get_total`        | —     | Cumulative stroops recorded              |
//! | `get_donor_total`  | —     | One donor's cumulative stroops           |
//! | `get_donor_count`  | —     | Number of unique donors                  |
//! | `get_admin`        | —     | Admin address                            |

#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype,
    Address, Env, String,
};

// ---------------------------------------------------------------------------
// Storage keys
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
// Events  (SDK 27 — #[contractevent] macro with #[topic] fields)
// ---------------------------------------------------------------------------

#[contractevent]
pub struct DonationRecorded {
    /// Becomes a topic in the XDR event envelope.
    #[topic]
    pub donor: Address,
    /// Stroops donated this call.
    pub amount_stroops: i128,
    /// Free-text tag (family id, supply category, etc.) — max 64 bytes.
    pub memo: String,
    /// Cumulative total after this donation.
    pub running_total: i128,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct CalamityDonation;

/// Ledger TTL constants.
/// 1 ledger ≈ 5 s → 17 280 ledgers ≈ 1 day.
const LEDGERS_PER_DAY: u32 = 17_280;
const TTL_THRESHOLD: u32 = 30 * LEDGERS_PER_DAY; // extend if below 30 days
const TTL_EXTEND_TO: u32 = 60 * LEDGERS_PER_DAY; // extend out to 60 days

#[contractimpl]
impl CalamityDonation {
    // -----------------------------------------------------------------------
    // Constructor — runs once, atomically, at deploy time (CAP-0058).
    // Pass --  --admin <address>  in `stellar contract deploy`.
    // -----------------------------------------------------------------------
    pub fn __constructor(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Total, &0_i128);
        env.storage().instance().set(&DataKey::DonorCount, &0_u32);
        env.storage()
            .instance()
            .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
    }

    // -----------------------------------------------------------------------
    // record_donation
    //
    // Called by the donor in the SAME transaction that contains a classic
    // Payment op sending XLM to the LGU wallet.  The contract simply records
    // the amount — it never touches tokens itself.
    //
    // Parameters
    //   donor          — the donating address (must sign the transaction)
    //   amount_stroops — XLM amount in stroops (must match the Payment op)
    //   memo           — free-text tag (max 64 bytes recommended)
    // -----------------------------------------------------------------------
    pub fn record_donation(
        env: Env,
        donor: Address,
        amount_stroops: i128,
        memo: String,
    ) {
        donor.require_auth();

        if amount_stroops <= 0 {
            panic!("amount must be positive");
        }

        // ---- per-donor persistent total (unique donor tracking) ----
        let donor_key = DataKey::DonorTotal(donor.clone());
        let prev_donor: i128 = env
            .storage()
            .persistent()
            .get(&donor_key)
            .unwrap_or(0_i128);

        if prev_donor == 0 {
            // First donation from this address — increment unique donor count.
            let count: u32 = env
                .storage()
                .instance()
                .get(&DataKey::DonorCount)
                .unwrap_or(0);
            env.storage()
                .instance()
                .set(&DataKey::DonorCount, &(count + 1));
        }

        let new_donor_total = prev_donor + amount_stroops;
        env.storage().persistent().set(&donor_key, &new_donor_total);
        env.storage()
            .persistent()
            .extend_ttl(&donor_key, TTL_THRESHOLD, TTL_EXTEND_TO);

        // ---- global instance total ----
        let prev_total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Total)
            .unwrap_or(0_i128);
        let new_total = prev_total + amount_stroops;
        env.storage().instance().set(&DataKey::Total, &new_total);
        env.storage()
            .instance()
            .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);

        // ---- emit event ----
        DonationRecorded {
            donor,
            amount_stroops,
            memo,
            running_total: new_total,
        }
        .publish(&env);
    }

    // -----------------------------------------------------------------------
    // Read-only views
    // -----------------------------------------------------------------------

    pub fn get_total(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Total)
            .unwrap_or(0_i128)
    }

    pub fn get_donor_total(env: Env, donor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::DonorTotal(donor))
            .unwrap_or(0_i128)
    }

    pub fn get_donor_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::DonorCount)
            .unwrap_or(0)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialised")
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    /// Register the contract with constructor args and return a client.
    fn deploy<'a>(env: &'a Env, admin: &'a Address) -> CalamityDonationClient<'a> {
        // env.register() accepts constructor arguments as a tuple (SDK 27).
        let contract_id = env.register(CalamityDonation, (admin,));
        CalamityDonationClient::new(env, &contract_id)
    }

    #[test]
    fn test_record_and_totals() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let donor = Address::generate(&env);
        let client = deploy(&env, &admin);

        client.record_donation(
            &donor,
            &50_000_000_i128, // 5 XLM
            &soroban_sdk::String::from_str(&env, "family-001"),
        );

        assert_eq!(client.get_total(), 50_000_000);
        assert_eq!(client.get_donor_total(&donor), 50_000_000);
        assert_eq!(client.get_donor_count(), 1);
    }

    #[test]
    fn test_multiple_donations_same_donor() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let donor = Address::generate(&env);
        let client = deploy(&env, &admin);

        client.record_donation(
            &donor,
            &10_000_000_i128,
            &soroban_sdk::String::from_str(&env, "food"),
        );
        client.record_donation(
            &donor,
            &20_000_000_i128,
            &soroban_sdk::String::from_str(&env, "shelter"),
        );

        assert_eq!(client.get_total(), 30_000_000);
        assert_eq!(client.get_donor_total(&donor), 30_000_000);
        assert_eq!(client.get_donor_count(), 1); // still 1 unique donor
    }

    #[test]
    fn test_two_donors_each_counted() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let donor_a = Address::generate(&env);
        let donor_b = Address::generate(&env);
        let client = deploy(&env, &admin);

        client.record_donation(
            &donor_a,
            &10_000_000_i128,
            &soroban_sdk::String::from_str(&env, "a"),
        );
        client.record_donation(
            &donor_b,
            &20_000_000_i128,
            &soroban_sdk::String::from_str(&env, "b"),
        );

        assert_eq!(client.get_total(), 30_000_000);
        assert_eq!(client.get_donor_count(), 2);
        assert_eq!(client.get_donor_total(&donor_a), 10_000_000);
        assert_eq!(client.get_donor_total(&donor_b), 20_000_000);
    }

    #[test]
    #[should_panic(expected = "amount must be positive")]
    fn test_zero_amount_panics() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let donor = Address::generate(&env);
        let client = deploy(&env, &admin);

        client.record_donation(
            &donor,
            &0_i128,
            &soroban_sdk::String::from_str(&env, "x"),
        );
    }

    #[test]
    fn test_get_admin() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let client = deploy(&env, &admin);

        assert_eq!(client.get_admin(), admin);
    }
}
