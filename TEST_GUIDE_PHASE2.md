# AI Workspace Browser — Phase 2 Testing Guide

## Objective
Verify that the AI Workspace Browser persists:
- User logins (Gmail, YouTube, Discord)
- Browser cookies and sessions
- Window position and size
- All browser state across app restarts

## Prerequisites
- Run `npm install` to install dependencies (Electron, etc.)
- Run `npm run build` to compile TypeScript
- Electron app is ready to launch

## Test Procedure

### Test 1: Gmail Login Persistence

**Step A: Initial Login**
1. Run: `npm start`
2. Wait for browser window to open (should open google.com)
3. Click on "Sign in" button or navigate to gmail.com
4. Log in with your Gmail account (use a test account if available)
5. Verify you're logged in and can see your Gmail inbox
6. **Close the app completely** (⌘Q on Mac, Alt+F4 on Windows)
7. Note any console messages about saving state

**Step B: Restart and Verify**
1. Run: `npm start` again
2. **Expected result:** The browser window should open with Gmail still logged in
3. **Verify:**
   - You can see your Gmail inbox without logging in again
   - Cookies and session are intact
   - Window position is the same as when you closed it

**Result:** ✅ If Gmail remains logged in after restart, persistence works!

---

### Test 2: YouTube Login Persistence

**Step A: Initial Login**
1. From the same running instance (or fresh start)
2. In the browser, navigate to: `youtube.com`
3. Sign in with your YouTube account
4. Verify you're logged in (see your profile picture in top right)
5. Close the app

**Step B: Restart and Verify**
1. Run: `npm start` again
2. Navigate to `youtube.com` in the browser
3. **Expected result:** You should still be logged in
4. Verify you can see personalized recommendations/history

**Result:** ✅ If YouTube remains logged in, session persistence confirmed!

---

### Test 3: Window State Persistence

**Step A: Record Initial Position**
1. Run: `npm start`
2. Resize the window to something custom (e.g., 1000x600)
3. Move window to a specific screen position (e.g., far left)
4. Make note of the position and size
5. Close the app

**Step B: Verify Restoration**
1. Run: `npm start` again
2. **Expected result:** Window should open in the same position and size
3. Verify by comparing with notes from Step A

**Result:** ✅ If window size/position match, state persistence works!

---

### Test 4: Maximize State Persistence

**Step A: Maximize Window**
1. Run: `npm start`
2. Click the maximize button (or double-click title bar)
3. Verify window is maximized
4. Close the app

**Step B: Verify Maximized State**
1. Run: `npm start` again
2. **Expected result:** Window should open maximized
3. Verify it's not in the restored position from previous tests

**Result:** ✅ If window reopens maximized, maximize state persists!

---

### Test 5: Multiple Session Persistence

**Step A: Create Complex State**
1. Run: `npm start`
2. Log into Gmail (navigate to gmail.com)
3. Open new tab and navigate to youtube.com
4. Log into YouTube
5. Open another tab and navigate to discord.com
6. Try to log into Discord (or just browse)
7. Arrange tabs as desired
8. Move/resize window to custom position
9. Close the app

**Step B: Verify All State**
1. Run: `npm start` again
2. **Verify all of the following:**
   - Window size and position are restored
   - All three tabs are still open (Gmail, YouTube, Discord)
   - Gmail session is still active (you're logged in)
   - YouTube session is still active
   - No login prompts appear on previously-authenticated sites

**Result:** ✅ If all tabs and sessions persist, full persistence confirmed!

---

## Expected Behavior

### ✅ Should Work
- Logins persist across restarts
- Cookies are saved and restored
- LocalStorage is saved and restored
- Window size is remembered
- Window position is remembered
- Maximized state is remembered
- Multiple tabs maintain their state
- Browser history is preserved
- Form data is saved
- Site preferences are saved

### ⚠️ Known Limitations
- IndexedDB persistence depends on site implementation
- Service Workers may re-initialize
- Some sites may have additional security checks on restart

---

## Debugging

### Check the App Logs
When running `npm start`, watch the console for messages like:
```
[main] AI Workspace Browser starting...
[PersistentBrowserManager] Restored window state from disk
[PersistentBrowserManager] Loaded browser with URL: https://google.com
[main] Browser window initialized successfully
```

### Check Saved State File
The window state is saved to:
```
~/.config/parallel-workspaces/browser-state.json  (Linux/Mac)
%APPDATA%/parallel-workspaces/browser-state.json  (Windows)
```

You can inspect this file to see the saved window state.

### Check Partition Data
Electron stores session data in:
```
~/.config/parallel-workspaces/Partitions/persist%3Aai-workspace  (Linux/Mac)
%APPDATA%/parallel-workspaces/Partitions/persist%3Aai-workspace  (Windows)
```

This contains cookies, cache, and localStorage for the persistent partition.

---

## Success Criteria

✅ **All tests pass if:**
1. Gmail login persists across restart
2. YouTube login persists across restart
3. Window size is restored
4. Window position is restored
5. Maximized state is restored
6. Multiple tabs maintain their state
7. No login prompts appear on restart for authenticated sites

---

## Common Issues & Fixes

### Issue: "Window doesn't restore position"
**Fix:** Check that `browser-state.json` file exists and is valid JSON.

### Issue: "Logins not persisting"
**Fix:** Verify the `persist:ai-workspace` partition is being used. Check that session partitioning is enabled in BrowserWindow webPreferences.

### Issue: "App crashes on startup"
**Fix:** Check console logs for errors. Delete `browser-state.json` and try again with fresh state.

### Issue: "Multiple windows open"
**Fix:** Only ONE browser window should open. If you see multiple, check that you removed old Phase 1 code.

---

## Next Steps

Once all tests pass:
1. Proceed to improve browser realism (keyboard shortcuts, scrolling)
2. Add virtual cursor overlay
3. Integrate Playwright control
4. Build agent adapter system

---

**Phase 2 is complete when all tests pass consistently!**
