# Quick Reference

## Run the Script
```bash
npm start
```

## What Smart Contract Functions Are Called

### Via Stellar Router SDK (Atomic Execution)

**Function 1: `report()`**
- **Smart Contract:** `CD4JGS6BB5NZVSNKRNI43GUC6E3OBYLCLBQZJVTZLDVHQ5KDAOHVOIQF`
- **Method:** `report`
- **Arguments:** None (`[]`)
- **Returns:** `Vec<Report>` with strategy performance data

**Function 2: `lock_fees()`**
- **Smart Contract:** `CD4JGS6BB5NZVSNKRNI43GUC6E3OBYLCLBQZJVTZLDVHQ5KDAOHVOIQF`
- **Method:** `lock_fees`
- **Arguments:** `Option<u32>` → **`None`** (represented as `ScVal.scvVoid()`)
- **Returns:** Fee lock status for each strategy

## Critical Requirements

1. **Manager Address:** `GDQ4HYM5GRYMZX754BWXLCCE5UKNWVVLS2OEP5WNG6NXR6N4NWXA6QYA`
   - Required for authorization
   - Passed as both `caller` and `source`

2. **Execution Order:** 
   - `report()` MUST run first (updates strategy data)
   - `lock_fees()` runs second (uses updated data)

3. **Atomic Execution:**
   - Both succeed or both fail together
   - No partial state changes

## Code Location

Single file: `src/report-and-lock-fees.mjs`

Key code:
```javascript
const results = await sdk.simResult(invocations, {
  caller: MANAGER_ACCOUNT,  // Authorization
  source: MANAGER_ACCOUNT   // Source account
});
```

## Expected Results

**Total Gains:** ~248,000 tokens  
**Total Fees Locked:** ~49,600 tokens  
**Execution:** Atomic, single transaction


