# Annai MVP Test Plan

## Overview
This document outlines the testing procedures for the Annai MVP (Day 7: Integration and Testing).

---

## Day 6: Integration - Verification Summary

### ✅ Completed Tasks
1. **Content Script Integration** - [`entrypoints/content/index.tsx`](entrypoints/content/index.tsx:1)
   - FloatingWidget properly mounted on Notion pages
   - Widget appears in bottom-right corner
   - macOS-style animations implemented

2. **Popup Integration** - [`entrypoints/popup/App.tsx`](entrypoints/popup/App.tsx:1)
   - SettingsPanel integrated
   - Proper dimensions (400px × 500px)
   - Dark theme styling

3. **Background Script** - [`entrypoints/background.ts`](entrypoints/background.ts:1)
   - Message handling implemented
   - Installation/update listeners added
   - Storage change monitoring

4. **WXT Configuration** - [`wxt.config.ts`](wxt.config.ts:1)
   - All host_permissions configured:
     - OpenRouter API
     - Together AI API
     - OpenAI API
     - Anthropic API
     - Notion API
   - Icons configured
   - Action popup configured

5. **Chrome Extension Manifest** - [`.output/chrome-mv3/manifest.json`](.output/chrome-mv3/manifest.json:1)
   - Manifest v3 compatible
   - Proper permissions and host_permissions
   - Content scripts configured for Notion domains
   - Service worker background script

---

## Day 7: Testing Plan

### 1. Basic Functionality Tests

#### 1.1 Extension Installation
- [ ] Extension loads successfully in Chrome
- [ ] Extension icon appears in toolbar
- [ ] No console errors on load
- [ ] Background script initializes correctly

#### 1.2 Popup Settings
- [ ] Popup opens when clicking extension icon
- [ ] Settings panel displays correctly
- [ ] AI Provider dropdown shows options (OpenRouter, Together AI)
- [ ] Model dropdown updates based on provider selection
- [ ] API key input fields work correctly
- [ ] Show/hide password toggle functions
- [ ] Save buttons work and persist settings
- [ ] Settings persist after closing/reopening popup

#### 1.3 Widget Display
- [ ] Floating widget appears on Notion pages
- [ ] Widget icon displays correctly (Annai logo)
- [ ] Widget is draggable
- [ ] Widget maintains position after dragging
- [ ] Widget expands/collapses smoothly
- [ ] macOS-style animations work correctly

---

### 2. Chat Functionality Tests

#### 2.1 Message Sending
- [ ] Can type messages in input field
- [ ] Send button works
- [ ] Enter key sends message (Shift+Enter for newline)
- [ ] Messages appear in chat history
- [ ] User messages display on right side
- [ ] Assistant messages display on left side

#### 2.2 Chat History
- [ ] Messages persist across page refreshes
- [ ] Messages persist across browser sessions
- [ ] Clear chat button works
- [ ] Chat history loads correctly on widget open

#### 2.3 Multi-turn Conversations
- [ ] Can continue conversation with follow-up messages
- [ ] Context is maintained across messages
- [ ] Previous messages are included in AI requests

---

### 3. Streaming Tests

#### 3.1 Text Streaming
- [ ] Streaming works when enabled in settings
- [ ] Text appears character-by-character
- [ ] Streaming stops when complete
- [ ] Cursor/pulse indicator shows during streaming
- [ ] Streaming can be disabled in settings
- [ ] Non-streaming mode works (full text appears at once)

#### 3.2 Streaming Performance
- [ ] Streaming starts within 2 seconds of sending
- [ ] Streaming is smooth without lag
- [ ] No duplicate characters or text
- [ ] Final text matches non-streaming output

---

### 4. Tool Calling Tests

#### 4.1 Tool Call Detection
- [ ] AI recognizes when to use Notion tools
- [ ] Tool calls display in chat interface
- [ ] Tool call details are shown (tool name, parameters)

#### 4.2 Notion API Integration
- [ ] createPage tool works
  - [ ] Creates page in Notion database
  - [ ] Returns page ID
  - [ ] Displays success message
- [ ] getPage tool works
  - [ ] Retrieves page content
  - [ ] Displays page details
- [ ] updatePage tool works
  - [ ] Updates page properties
  - [ ] Confirms changes
- [ ] deletePage tool works
  - [ ] Deletes page
  - [ ] Confirms deletion
- [ ] appendBlock tool works
  - [ ] Adds block to page
  - [ ] Block appears in Notion
- [ ] updateBlock tool works
  - [ ] Modifies block content
  - [ ] Changes reflect in Notion
- [ ] deleteBlock tool works
  - [ ] Removes block from page
  - [ ] Block disappears from Notion

#### 4.3 Tool Results Display
- [ ] Tool results appear in chat
- [ ] Success messages show in green
- [ ] Error messages show in red
- [ ] Tool results are formatted correctly
- [ ] JSON results are pretty-printed

#### 4.4 Error Handling
- [ ] Invalid API keys show error message
- [ ] Network errors are caught and displayed
- [ ] Invalid tool parameters show helpful error
- [ ] Tool execution failures don't crash widget
- [ ] User can retry after error

---

### 5. AI Provider Tests

#### 5.1 OpenRouter
- [ ] Can select OpenRouter as provider
- [ ] OpenRouter API key works
- [ ] Models load correctly (Claude 3.5 Sonnet, GPT-4 Turbo, etc.)
- [ ] Chat responses work
- [ ] Tool calling works with OpenRouter models

#### 5.2 Together AI
- [ ] Can select Together AI as provider
- [ ] Together AI API key works
- [ ] Models load correctly (Llama 3 70B, Mixtral, etc.)
- [ ] Chat responses work
- [ ] Tool calling works with Together AI models

#### 5.3 Provider Switching
- [ ] Can switch between providers
- [ ] Settings persist provider selection
- [ ] Model list updates when provider changes
- [ ] API keys are independent per provider

---

### 6. UI/UX Tests

#### 6.1 Widget UI
- [ ] Widget is responsive to window size
- [ ] Widget doesn't overlap Notion UI elements
- [ ] Widget z-index is correct (always on top)
- [ ] Widget is draggable without issues
- [ ] Widget maintains position on scroll
- [ ] Widget doesn't interfere with Notion functionality

#### 6.2 Animations
- [ ] Expand animation is smooth (macOS-style spring)
- [ ] Collapse animation is smooth
- [ ] Close animation works correctly
- [ ] No animation glitches or flickering
- [ ] Animations complete in reasonable time (~400ms)

#### 6.3 Settings UI
- [ ] Settings panel fits within popup
- [ ] All controls are accessible
- [ ] Scroll works if content overflows
- [ ] Save buttons provide feedback
- [ ] Input validation works

#### 6.4 Dark Theme
- [ ] Dark theme is consistent across UI
- [ ] Text contrast is readable
- [ ] Borders and backgrounds are visible
- [ ] Icons are visible

---

### 7. Error Handling Tests

#### 7.1 API Errors
- [ ] Invalid API key shows error message
- [ ] Expired API key shows error message
- [ ] Rate limit errors are handled gracefully
- [ ] Network timeouts show error message
- [ ] Server errors (500+) show error message

#### 7.2 Input Errors
- [ ] Empty message cannot be sent
- [ ] Very long messages are handled
- [ ] Special characters work correctly
- [ ] Unicode characters work correctly

#### 7.3 Storage Errors
- [ ] Settings save failure is handled
- [ ] Chat history save failure is handled
- [ ] IndexedDB errors don't crash widget
- [ ] LocalStorage errors don't crash widget

#### 7.4 Tool Errors
- [ ] Invalid tool parameters show error
- [ ] Tool execution timeout shows error
- [ ] Notion API errors are displayed
- [ ] Tool errors don't prevent other tools from running

---

### 8. Cross-Browser Compatibility Tests

#### 8.1 Chrome
- [ ] Extension loads in Chrome
- [ ] All features work in Chrome
- [ ] No console errors in Chrome
- [ ] Performance is acceptable

#### 8.2 Edge
- [ ] Extension loads in Edge
- [ ] All features work in Edge
- [ ] No console errors in Edge
- [ ] Performance is acceptable

#### 8.3 Brave
- [ ] Extension loads in Brave
- [ ] All features work in Brave
- [ ] No console errors in Brave
- [ ] Performance is acceptable
- [ ] Brave's privacy features don't interfere

---

### 9. Performance Tests

#### 9.1 Load Time
- [ ] Widget loads within 2 seconds
- [ ] Popup opens within 1 second
- [ ] Settings load within 1 second

#### 9.2 Response Time
- [ ] AI response starts within 3 seconds
- [ ] Streaming begins within 2 seconds
- [ ] Tool calls execute within 5 seconds

#### 9.3 Memory Usage
- [ ] No memory leaks detected
- [ ] Memory usage is stable over time
- [ ] Closing widget frees memory

#### 9.4 Network Usage
- [ ] API requests are efficient
- [ ] No unnecessary requests
- [ ] Streaming reduces perceived latency

---

### 10. Security Tests

#### 10.1 API Key Storage
- [ ] API keys are stored securely
- [ ] API keys are not exposed in console
- [ ] API keys are not sent to third parties
- [ ] API keys are cleared on uninstall (optional)

#### 10.2 Data Privacy
- [ ] Chat history is stored locally
- [ ] Chat history is not sent to third parties
- [ ] User data is not tracked
- [ ] No telemetry data collected

#### 10.3 CORS
- [ ] All API calls respect CORS
- [ ] No cross-origin errors
- [ ] Host permissions are sufficient

---

## Test Results Template

| Test Category | Test Name | Status | Notes |
|--------------|------------|--------|-------|
| Installation | Extension loads | ⬜ | |
| Popup | Settings display | ⬜ | |
| Widget | Widget appears | ⬜ | |
| Chat | Send message | ⬜ | |
| Streaming | Text streaming | ⬜ | |
| Tool Calling | createPage | ⬜ | |
| Tool Calling | getPage | ⬜ | |
| Tool Calling | updatePage | ⬜ | |
| Tool Calling | deletePage | ⬜ | |
| Tool Calling | appendBlock | ⬜ | |
| Tool Calling | updateBlock | ⬜ | |
| Tool Calling | deleteBlock | ⬜ | |
| AI Provider | OpenRouter | ⬜ | |
| AI Provider | Together AI | ⬜ | |
| UI/UX | Animations | ⬜ | |
| Error Handling | Invalid API key | ⬜ | |
| Cross-Browser | Chrome | ⬜ | |
| Cross-Browser | Edge | ⬜ | |
| Cross-Browser | Brave | ⬜ | |

---

## Known Issues & Limitations

### Current Limitations
1. **Settings Storage**: Currently using localStorage, should migrate to chrome.storage.local for better security
2. **No Backend**: All API calls are made directly from the extension
3. **No Search**: Notion search/query functionality not implemented
4. **No Templates**: Template system not implemented
5. **Single Chat**: Only one chat session at a time

### Future Improvements
1. Implement chrome.storage.local for settings
2. Add backend server for API proxy
3. Implement Notion search functionality
4. Add template system
5. Support multiple chat sessions
6. Add export/import functionality
7. Add keyboard shortcuts
8. Add voice input support

---

## Test Execution Instructions

### Manual Testing Steps

1. **Load Extension in Chrome**
   ```bash
   bun run dev
   ```
   - Open `chrome://extensions`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select `.output/chrome-mv3` folder

2. **Test on Notion**
   - Navigate to `https://www.notion.so`
   - Log in to your Notion account
   - Verify widget appears in bottom-right corner

3. **Configure Settings**
   - Click extension icon
   - Enter OpenRouter API key
   - Select model (e.g., Claude 3.5 Sonnet)
   - Enter Notion API key
   - Enter Notion Database ID
   - Click "Save AI Settings"
   - Click "Save Notion Settings"

4. **Test Chat**
   - Click Annai widget icon
   - Type: "Hello, can you help me?"
   - Click send
   - Verify response appears

5. **Test Tool Calling**
   - Type: "Create a new page called 'Test Page'"
   - Verify tool call executes
   - Check Notion for new page

6. **Test Streaming**
   - Go to settings
   - Enable streaming
   - Send a message
   - Verify text appears character-by-character

7. **Test Cross-Browser**
   - Load extension in Edge
   - Load extension in Brave
   - Repeat tests

---

## Success Criteria

The MVP is considered complete when:

- [ ] All basic functionality tests pass
- [ ] At least one AI provider works (OpenRouter or Together AI)
- [ ] At least 3 Notion tools work (createPage, getPage, updatePage)
- [ ] Streaming works correctly
- [ ] Error handling works for common cases
- [ ] Extension works in Chrome
- [ ] No critical bugs or crashes
- [ ] User can complete basic workflow:
  1. Install extension
  2. Configure API keys
  3. Start chat
  4. Create Notion page via AI
  5. Update page via AI

---

## Next Steps After MVP

1. **v1.0 Release**
   - Fix any critical bugs found during testing
   - Improve error messages
   - Add user documentation

2. **v1.1 Features**
   - Migrate to chrome.storage.local
   - Add more Notion tools
   - Improve UI/UX

3. **v1.2 Features**
   - Add backend server
   - Implement search functionality
   - Add templates

---

*Document created: 2026-01-18*
*Last updated: 2026-01-18*
