# Asset Symbol Validation

## Overview
The system now validates all asset symbols before processing to ensure only genuine, tradeable assets are analyzed. This prevents errors and wasted API calls from invalid or made-up symbols.

## Validation Rules

### ✅ Valid Symbols
- Real stock tickers (e.g., AAPL, TSLA, SPY, MSFT)
- ETFs (e.g., SPY, QQQ, VOO)
- Must have trading history in yfinance
- Maximum 10 characters

### ❌ Invalid Symbols
- Random strings (e.g., "NOTAREALSTOCK", "FAKE123")
- Empty or whitespace-only input
- Symbols longer than 10 characters
- Non-existent tickers

## Features

### 1. **Automatic Validation**
All asset symbols are validated before analysis begins:
```python
# In API endpoint
is_valid, error_msg = validate_asset_symbol(asset)
if not is_valid:
    raise HTTPException(status_code=400, detail=error_msg)
```

### 2. **Case Normalization**
Symbols are automatically converted to uppercase:
- Input: `aapl` → Output: `AAPL`
- Input: `Spy` → Output: `SPY`

### 3. **Clear Error Messages**
Users receive helpful feedback when entering invalid symbols:
```
❌ Symbol 'NOTAREALSTOCK' is too long (max 10 characters)
❌ Symbol 'FAKE123' not found or has no data
❌ Symbol cannot be empty
```

### 4. **Caching**
Valid symbols are cached to avoid repeated validation:
- First validation: ~2-3 seconds (API call to yfinance)
- Subsequent validations: Instant (cached result)

## Integration Points

### API Endpoint (`/analyze-asset`)
```python
POST /analyze-asset?asset=AAPL&user_id=test_user

# Returns 400 error if symbol is invalid
{
  "detail": "Symbol 'NOTAREALSTOCK' is too long (max 10 characters)"
}
```

### MarketWatcherAgent
```python
# Validates symbol before running LLM council
is_valid, error_msg = validate_asset_symbol(asset)
if not is_valid:
    context["market_opinions"] = [f"Invalid asset symbol: {error_msg}"]
    return context
```

### Frontend (frontend.js)
```javascript
// Displays user-friendly error alerts
if (response.status === 400) {
    const errorData = await response.json();
    alert(`❌ ${errorData.detail}\n\nPlease enter a valid stock symbol`);
}
```

## Testing

### Unit Tests
Run validation tests:
```bash
python test_asset_validator.py
```

Tests include:
- ✅ Valid symbols (AAPL, SPY, TSLA, etc.)
- ❌ Invalid symbols (random strings, empty input)
- 🔤 Case normalization
- ⚠️ Exception handling

### Integration Tests
Test API validation:
```bash
python test_api_validation.py
```

Tests include:
- API health check
- Valid asset acceptance
- Invalid asset rejection
- Empty input rejection
- Case insensitivity

## Usage Examples

### Python (Direct Validation)
```python
from services.asset_validator import validate_asset_symbol, validate_asset_or_raise

# Method 1: Check validation
is_valid, error = validate_asset_symbol("AAPL")
if is_valid:
    print("✓ Symbol is valid")
else:
    print(f"✗ Error: {error}")

# Method 2: Raise exception if invalid
try:
    symbol = validate_asset_or_raise("NOTREAL")
except AssetValidationError as e:
    print(f"Invalid: {e}")
```

### API Request (curl)
```bash
# Valid symbol
curl -X POST "http://localhost:8000/analyze-asset?asset=AAPL&user_id=test"

# Invalid symbol - returns 400 error
curl -X POST "http://localhost:8000/analyze-asset?asset=NOTREAL&user_id=test"
```

### Frontend (JavaScript)
```javascript
// User enters "NOTAREALSTOCK"
// Frontend will receive 400 error with message:
// "Symbol 'NOTAREALSTOCK' is too long (max 10 characters)"
// 
// User will see alert:
// ❌ Symbol 'NOTAREALSTOCK' is too long (max 10 characters)
// 
// Please enter a valid stock symbol (e.g., AAPL, SPY, TSLA)
```

## Performance

- **First validation**: ~2-3 seconds (yfinance API call)
- **Cached validation**: <1ms (instant)
- **Validation overhead**: Minimal (~2-3s added to first request)
- **API call savings**: Prevents 60-120s wasted on invalid symbols

## Error Handling

The system gracefully handles validation errors at multiple levels:

1. **Input Validation**: Checks for empty/malformed input
2. **API Validation**: Verifies symbol exists in financial data
3. **Fallback Logic**: MarketWatcherAgent continues with error context
4. **User Feedback**: Clear, actionable error messages

## Benefits

✅ **Prevents Wasted Resources**
- No more 60-120 second analysis for invalid symbols
- Saves API calls to LLM services
- Reduces server load

✅ **Better User Experience**
- Instant feedback on invalid input
- Clear, helpful error messages
- Suggests correct format

✅ **Data Quality**
- Ensures all analyses use real assets
- Prevents garbage data in database
- Maintains system integrity

## Files Modified

1. **`services/asset_validator.py`** (NEW)
   - Core validation logic
   - Symbol normalization
   - Caching mechanism

2. **`main.py`**
   - Added validation to `/analyze-asset` endpoint
   - Added validation to `MarketWatcherAgent.run_async()`

3. **`frontend.js`**
   - Enhanced error handling for 400 responses
   - User-friendly error messages

4. **`test_asset_validator.py`** (NEW)
   - Unit tests for validation logic

5. **`test_api_validation.py`** (NEW)
   - Integration tests for API endpoint

## Future Enhancements

Potential improvements:
- Add support for crypto symbols (BTC-USD, ETH-USD)
- Support international exchanges (TSE, LSE)
- Validate options symbols (AAPL240119C00150000)
- Add fuzzy matching for typos (e.g., "APLE" → "Did you mean AAPL?")
- Pre-validate on frontend before API call
