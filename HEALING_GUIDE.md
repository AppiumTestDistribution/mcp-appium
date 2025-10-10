# Test Healing & Auto-Recovery Guide

## Overview
The Test Healing system in Jarvis Appium automatically fixes failing element locators using a combination of smart fallback strategies and AI-powered analysis.

## How It Works

### 1. Initial Attempt
When you try to find an element, the system first attempts using your provided locator:
```
appium_find_element_with_healing("id", "login_button", "login button")
```

### 2. Fallback Strategies
If the initial attempt fails, the system automatically tries alternative locators:

**For Android:**
- ID → Accessibility ID → XPath variants → UiAutomator selectors

**For iOS:**
- ID/Name → Accessibility ID → XPath variants → iOS Predicate strings

### 3. AI-Powered Recovery (Moderate/Aggressive modes)
If fallback strategies fail, Gemini Flash analyzes the screenshot:
- Takes screenshot of current screen
- Analyzes visual elements using computer vision
- Suggests new locators based on element appearance and context
- Tries AI-suggested locators in order of confidence

### 4. Logging & Analytics
All healing attempts are logged with:
- Original locator that failed
- Each fallback attempt and result
- AI suggestions and confidence scores
- Time taken for healing
- Final outcome (success/failure)

## Healing Modes

### Conservative Mode
**Best for**: Stable tests, minimal changes expected
- 2 retry attempts
- Basic fallback strategies only
- No AI assistance
- Fast, predictable behavior

```javascript
configure_healing("conservative")
```

### Moderate Mode (Recommended)
**Best for**: Most use cases, balanced approach
- 3 retry attempts
- Fallback strategies + AI assistance
- Gemini Flash analyzes screenshots
- Good balance of speed and intelligence

```javascript
configure_healing("moderate")
```

### Aggressive Mode
**Best for**: Frequently changing UIs, maximum recovery
- 5 retry attempts
- All fallback strategies
- AI-powered suggestions
- Visual matching enabled
- Auto-updates locators (future)

```javascript
configure_healing("aggressive")
```

### Disabled Mode
**Best for**: Debugging, when you want immediate failures
- No healing attempts
- Fails immediately if locator doesn't work

```javascript
configure_healing("disabled")
```

## Configuration Details

```typescript
{
  conservative: {
    maxRetries: 2,
    retryDelayMs: 1000,
    useExponentialBackoff: true,
    enableAIFallback: false,
    enableVisualMatching: false,
  },
  moderate: {
    maxRetries: 3,
    retryDelayMs: 1000,
    useExponentialBackoff: true,
    enableAIFallback: true,
    enableVisualMatching: false,
  },
  aggressive: {
    maxRetries: 5,
    retryDelayMs: 500,
    useExponentialBackoff: true,
    enableAIFallback: true,
    enableVisualMatching: true,
  }
}
```

## Usage Examples

### Example 1: Basic Healing
```
1. configure_healing("moderate")
2. appium_find_element_with_healing("id", "submit_button")
   - Tries: id="submit_button"
   - Falls back to: accessibility id="submit_button"
   - Falls back to: xpath="//*[@resource-id='submit_button']"
   - Success! Element found with accessibility id
```

### Example 2: AI-Assisted Healing
```
1. configure_healing("moderate")
2. appium_find_element_with_healing(
     "id", 
     "old_locator_that_changed",
     "blue submit button at bottom right"
   )
   - Tries: id="old_locator_that_changed" ✗
   - Tries: accessibility id ✗
   - Tries: xpath variants ✗
   - AI analyzes screenshot
   - AI suggests: xpath="//android.widget.Button[@text='Submit']" ✓
   - Success! Element found with AI suggestion
```

### Example 3: Viewing Healing Report
```
get_healing_report()

Returns:
Healing Report:
===============
Total Healing Attempts: 15
Successful: 12
Failed: 3
Success Rate: 80.00%
Average Healing Time: 450.25ms
AI Assistance Used: 5 times

Detailed History (last 10 events):
1. 2025-10-10T15:30:22.123Z
   Original: id="login_button"
   Healing: accessibility id="login_button"
   Result: ✓ SUCCESS
   Time: 245ms
   AI Used: No
   
...
```

## Best Practices

### 1. Provide Element Descriptions
Always include a description when using healing for better AI suggestions:
```
❌ Bad:  appium_find_element_with_healing("id", "btn_123")
✓ Good: appium_find_element_with_healing("id", "btn_123", "green submit button")
```

### 2. Start with Moderate Mode
Don't immediately jump to aggressive mode. Start with moderate and increase if needed.

### 3. Monitor Healing Reports
Regularly check healing reports to understand:
- Which locators are frequently failing
- Which healing strategies work best
- Whether your locators need updating

### 4. Use Conservative for Stable Tests
If your tests are stable and rarely fail, use conservative mode for faster execution.

### 5. Disable for Debugging
When debugging why a locator fails, temporarily disable healing to see the actual error.

## Troubleshooting

### Healing Takes Too Long
- Use conservative mode for faster execution
- Reduce retry attempts in custom config
- Disable AI fallback if not needed

### AI Suggestions Not Working
- Ensure GEMINI_API_KEY is set correctly
- Check if screenshots are being captured
- Verify element is visible on screen
- Try providing more detailed element descriptions

### Too Many False Positives
- Use conservative mode
- Reduce maxRetries
- Be more specific with element descriptions
- Check if multiple similar elements exist

## Technical Details

### Fallback Strategy Generation
The system analyzes your original locator and generates intelligent fallbacks:
- Extracts keywords from selectors
- Converts between locator types
- Generates platform-specific alternatives

### AI Analysis Process
1. Captures screenshot (base64)
2. Resizes to 1024x1024 for optimal AI processing
3. Sends to Gemini Flash with element description
4. Receives structured JSON with locator suggestions
5. Each suggestion includes confidence score and reasoning

### Exponential Backoff
Retry delays increase exponentially to avoid overwhelming:
- Attempt 1: 1000ms
- Attempt 2: 2000ms
- Attempt 3: 4000ms
- etc.

## Performance Impact

### Conservative Mode
- Minimal overhead (~200-500ms extra for fallback attempts)
- No AI API calls
- Predictable timing

### Moderate Mode
- Moderate overhead (~500-2000ms when healing is needed)
- AI calls only when fallbacks fail
- Good for most use cases

### Aggressive Mode
- Higher overhead (~1000-5000ms when healing is needed)
- More retry attempts and AI calls
- Best for critical tests that must pass

## Cost Considerations

### API Usage
- Conservative: No AI API calls
- Moderate: AI calls only on fallback failure (~$0.001 per healing attempt)
- Aggressive: More AI calls (~$0.002-0.003 per healing attempt)

### Recommendations
- Use moderate mode for most tests
- Reserve aggressive mode for critical paths
- Monitor AI usage through healing reports
