# Test Healing Example Scenarios

## Scenario 1: Basic Healing with Fallback

### Problem
Your app was updated and the login button ID changed from `login_button` to `btn_login`

### Without Healing
```
❌ appium_find_element("id", "login_button")
Error: Element not found
Test fails immediately
```

### With Healing (Conservative Mode)
```
✅ configure_healing("conservative")
✅ appium_find_element_with_healing("id", "login_button")

Healing Process:
1. Try id="login_button" ❌ Failed
2. Try accessibility id="login_button" ❌ Failed  
3. Try xpath="//*[@resource-id='login_button']" ✅ SUCCESS!

Result: Element found! Test continues.
```

## Scenario 2: AI-Powered Healing

### Problem
Major UI redesign changed all element IDs and structure

### Without Healing
```
❌ Multiple locators fail
❌ Hours of manual debugging
❌ Need to update all test scripts
```

### With Healing (Moderate Mode)
```
✅ configure_healing("moderate")
✅ appium_find_element_with_healing(
     "id", 
     "old_submit_button",
     "green submit button at bottom right corner"
   )

Healing Process:
1. Try id="old_submit_button" ❌ Failed
2. Try accessibility id ❌ Failed
3. Try XPath alternatives ❌ Failed
4. 🤖 AI Screenshot Analysis...
   - Gemini Flash analyzes screenshot
   - Identifies green button at bottom right
   - Suggests: xpath="//android.widget.Button[@text='Submit']"
5. Try AI suggestion ✅ SUCCESS!

Result: Element found with AI assistance!
Healing Time: 1,245ms
```

## Scenario 3: Comprehensive Healing Report

### After Running Multiple Tests
```
✅ get_healing_report()

Output:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Healing Report:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Healing Attempts: 25
Successful: 21
Failed: 4
Success Rate: 84.00%
Average Healing Time: 687.50ms
AI Assistance Used: 8 times

Detailed History (last 10 events):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 2025-10-10T15:30:22.123Z
   Original: id="login_button"
   Healing: accessibility id="login_button"
   Result: ✓ SUCCESS
   Time: 245ms
   AI Used: No

2. 2025-10-10T15:31:45.678Z
   Original: id="submit_form"
   Healing: xpath="//android.widget.Button[@text='Submit']"
   Result: ✓ SUCCESS (AI-powered)
   Time: 1,456ms
   AI Used: Yes
   Confidence: 0.92

3. 2025-10-10T15:32:10.234Z
   Original: xpath="//*[@resource-id='cancel']"
   Healing: id="cancel"
   Result: ✓ SUCCESS
   Time: 512ms
   AI Used: No

...
```

## Scenario 4: Real-World Login Flow

### Test Code with Healing
```
# Configure healing once at the beginning
configure_healing("moderate")

# Login test with automatic healing
1. appium_find_element_with_healing(
     "id", "username_field",
     "username input field at top"
   )
   → Healed: Found using accessibility id

2. appium_set_value(elementUUID, "testuser@example.com")

3. appium_find_element_with_healing(
     "id", "password_field", 
     "password field below username"
   )
   → Found immediately (no healing needed)

4. appium_set_value(elementUUID, "Password123")

5. appium_find_element_with_healing(
     "id", "login_button",
     "blue login button with text 'Sign In'"
   )
   → Healed with AI: xpath="//android.widget.Button[@text='Sign In']"

6. appium_click(elementUUID)

7. appium_find_element_with_healing(
     "id", "welcome_message",
     "welcome message after login"
   )
   → Found immediately

Result: ✅ Test passed with 2 healing events
Total Time: ~5 seconds (including healing)
```

## Scenario 5: Comparing Healing Modes

### Same Test, Different Modes

#### Disabled Mode
```
configure_healing("disabled")
Result: ❌ Fails immediately when locator breaks
Time: 100ms
Cost: $0
```

#### Conservative Mode  
```
configure_healing("conservative")
Result: ✅ 60% success rate (basic fallbacks)
Time: 300ms average
Cost: $0
```

#### Moderate Mode (Recommended)
```
configure_healing("moderate")
Result: ✅ 85% success rate (fallbacks + AI)
Time: 700ms average
Cost: ~$0.001 per healing
```

#### Aggressive Mode
```
configure_healing("aggressive")
Result: ✅ 95% success rate (everything enabled)
Time: 1,200ms average
Cost: ~$0.002 per healing
```

## Best Practices from Examples

### ✅ DO: Provide Element Descriptions
```
Good: appium_find_element_with_healing(
  "id", "btn_123", 
  "blue submit button at bottom"
)
```

### ❌ DON'T: Skip Descriptions
```
Bad: appium_find_element_with_healing("id", "btn_123")
// AI can't help without context
```

### ✅ DO: Use Appropriate Healing Mode
```
Stable tests → conservative
Normal tests → moderate
Critical tests → aggressive
```

### ✅ DO: Monitor Healing Reports
```
Regularly check: get_healing_report()
Identify patterns
Update problematic locators
```

### ✅ DO: Configure Once Per Session
```
# At test start
configure_healing("moderate")

# Then use healing throughout
appium_find_element_with_healing(...)
appium_find_element_with_healing(...)
// Mode persists
```

## Performance Expectations

| Scenario | Time Without Healing | Time With Healing | Outcome |
|----------|---------------------|-------------------|---------|
| Element found first try | 100ms | 100ms | No overhead |
| Healed with fallback | ❌ Test fails | 300-500ms | ✅ Test passes |
| Healed with AI | ❌ Test fails | 1-2 seconds | ✅ Test passes |
| Cannot be healed | ❌ Fails at 100ms | ❌ Fails at 2-3s | Better debugging info |

## Conclusion

Test healing provides:
- ✅ Automatic recovery from UI changes
- ✅ Reduced test maintenance
- ✅ Better test stability
- ✅ Detailed healing analytics
- ✅ AI-powered intelligent recovery

Cost is minimal (< $0.01 per test) and time overhead only occurs when healing is needed.
