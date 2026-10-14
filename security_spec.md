# Security Specification - Bütçem Firestore Security Rules

## 1. Data Invariants
1. All client reads and writes are scoped to specific vaults identified by an alphanumeric `vaultId` (`/vaults/{vaultId}`).
2. Listing the entire `/vaults` collection is strictly forbidden (`allow list: if false`) to prevent enumeration attacks and unauthorized discovery of user vaults.
3. Every vault write must validate that the document payload's `vaultId` matches the path `{vaultId}`.
4. Total list bounds must be enforced on `transactions` (<= 2000), `categories` (<= 100), and `savingsGoals` (<= 100) to protect against Denial of Wallet attacks.
5. All IDs must strictly match the regex pattern `^[a-zA-Z0-9_\-]+$` and be under 128 characters.
6. The global catch-all deny rule must be in place as the first rule block.

## 2. Dirty Dozen Test Payloads
1. **Unbounded Transactions Array Attack**: Payload containing > 2000 transaction items to cause high storage overhead. (Expect: PERMISSION_DENIED)
2. **Collection Enumeration (List Query)**: Attempting `getDocs(collection(db, 'vaults'))` without specifying a document ID. (Expect: PERMISSION_DENIED)
3. **Invalid Vault ID Character Injection**: Attempting to write to `/vaults/evil%20id/` with non-matching regex. (Expect: PERMISSION_DENIED)
4. **Mismatched Vault ID**: Document payload with `vaultId: "vault-A"` written to `/vaults/vault-B`. (Expect: PERMISSION_DENIED)
5. **Junk Field Pollution**: Sending unsupported ghost keys or malformed data structures. (Expect: PERMISSION_DENIED)
6. **Non-String updatedAt Timestamp**: Passing integer or null for `updatedAt`. (Expect: PERMISSION_DENIED)
7. **Oversized String Injection**: Injecting a 2MB string into `vaultId` or `updatedAt`. (Expect: PERMISSION_DENIED)
8. **Invalid Schema on Create**: Attempting to create a document without the required `vaultId` and `updatedAt` properties. (Expect: PERMISSION_DENIED)
9. **Unauthenticated Global Path Traversal**: Accessing arbitrary paths like `/admin`, `/users`, or `/secrets`. (Expect: PERMISSION_DENIED)
10. **Arbitrary Document Deletion**: Attempting to delete a user's vault document via client SDK. (Expect: PERMISSION_DENIED)
11. **Type Confusion Attack**: Supplying a string instead of a map for `settings` or `distributedSavings`. (Expect: PERMISSION_DENIED)
12. **Array Item Poisoning**: Providing a string instead of a list for `transactions`. (Expect: PERMISSION_DENIED)
