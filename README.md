# MuSync – React Native Music Player

VIDEO DEMO 



https://github.com/user-attachments/assets/b848aa8d-6e88-403a-9075-0a160d90eefe



A modern, fully-functional music player built with **Expo & React Native**, inspired by Spotify. Features real-time search, seamless playback across songs/artists/playlists, persistent queue management, and offline download support.

---

## ✨ Features

- 🔍 **Unified Search** – Search songs, artists, and playlists with pagination (20 results/page)
- 🧑‍🎤 **Artist & Playlist Details** – Browse and play tracks directly from context
- 📱 **Dual Player UIs** – Persistent mini player + full-featured player screen
- 🧾 **Queue Management** – Add, remove, and reorder songs; persisted locally
- ⏱️ **Recently Played** – Auto-saved track history (up to 20 songs)
- ⬇️ **Track Downloads** – Per-track caching (320 kbps) for offline listening
- 🎧 **Background Playback** – Continues playing when app is backgrounded
- 🌙 **Dark Theme** – Ocean blue accents with solid dark surfaces (Spotify-inspired)
- ⚡ **High Performance** – Optimized FlatList rendering (memoized components, batched updates)

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Expo 50, React Native 0.73.2 |
| **Language** | TypeScript 5.3+ |
| **Navigation** | React Navigation v6 (Stack) |
| **State** | Zustand (minimal, performant store) |
| **Storage** | AsyncStorage (queue, settings, history, downloads) |
| **Audio** | expo-av (playback + background support) |
| **Files** | expo-file-system (download caching) |
| **HTTP** | Axios (API client) |
| **Icons** | Ionicons (Expo Icon Library) |
| **Styling** | React Native StyleSheet (theme-driven) |

---

## 📁 Project Structure

```
src/
├── components/
│   └── MiniPlayer.tsx              # Persistent bottom player with progress bar
├── constants/
│   └── theme.ts                    # Centralized design tokens (colors, typography, spacing)
├── navigation.tsx                  # Stack navigator + mini player wrapper
├── screens/
│   ├── HomeScreen.tsx              # Unified search + sections (recents, artists, playlists, songs)
│   ├── ArtistScreen.tsx            # Artist detail + songs + add-to-queue button
│   ├── PlaylistScreen.tsx          # Playlist detail + songs + add-to-queue button
│   ├── PlayerScreen.tsx            # Full player UI + controls + download button
│   └── QueueScreen.tsx             # Queue management (view, remove, reorder)
├── services/
│   ├── api.ts                      # JioSaavn API client (search, artist/playlist details)
│   ├── storage.ts                  # AsyncStorage abstraction + persistence keys
│   └── download.ts                 # File download & cache management helpers
├── store/
│   └── playerStore.ts              # Zustand store (playback, queue, modes, history)
├── types/
│   └── index.ts                    # TypeScript interfaces (Song, Artist, Playlist, QueueItem)
└── utils/
    └── helpers.ts                  # Formatting (duration, image URLs, play counts), debounce, sanitization
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js 18+** and npm
- **Expo Go** app (iOS App Store / Google Play)
- **Optional**: Xcode (macOS, for iOS) or Android Studio (for Android)

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Expo dev server
npm start

# 3. Connect device/emulator
#    – Scan QR code with Expo Go, OR
#    – Press 'a' for Android emulator, 'i' for iOS simulator, 'w' for web
```

### Available Scripts

```bash
npm start               # Start Expo dev server (interactive)
npm run type-check    # TypeScript strict mode check
npm run lint          # ESLint code quality check
npm run android       # Launch Android emulator (native config)
npm run ios           # Launch iOS simulator (native config)
npm run web           # Preview in web browser (limited functionality)
```

---

## 📖 Architecture

### 1. State Management with Zustand

**Location**: [src/store/playerStore.ts](src/store/playerStore.ts)

The entire player logic is centralized in a single Zustand store:

```typescript
// State
currentSong: Song | null                // Currently playing track
queue: QueueItem[]                      // Full queue with metadata
position: number                        // Playback position (seconds)
duration: number                        // Track duration (seconds)
isPlaying: boolean                      // Play/pause state
volume: number                          // Volume level (0–1)
isShuffled: boolean                     // Shuffle enabled
repeatMode: 'off' | 'one' | 'all'      // Repeat behavior
recentlyPlayed: Song[]                  // History (persisted, max 20)

// Actions
playSong(song, queue?, index?)          // Start playback
togglePlayPause()                       // Play/pause
seekTo(position)                        // Jump to time
playNext() / playPrevious()             // Navigation
addToQueue(song)                        // Append to queue
removeFromQueue(queueId)                // Remove by ID
reorderQueue(from, to)                  // Reorder items
clearQueue()                            // Empty queue
loadPersistedState()                    // Restore from AsyncStorage on startup
```

**Design Rationale**:
- **Single source of truth** – All playback state in one place, no prop drilling
- **Automatic subscriptions** – Components only re-render when their specific slice changes
- **Minimal boilerplate** – No actions, reducers, or middleware (vs. Redux)
- **Async actions** – Built-in support for `async/await` side effects
- **Persistence** – Each action automatically saves relevant state to AsyncStorage

### 2. Navigation Architecture

**Location**: [src/navigation.tsx](src/navigation.tsx)

Uses React Navigation Stack with 5 screens:

```
HomeScreen (root)
├── → ArtistScreen
├── → PlaylistScreen
├── → PlayerScreen (full-screen player)
└── → QueueScreen (queue management)
```

**Mini Player Wrapper**: Rendered above stack to remain visible on all screens.

**Design Rationale**:
- **Stack navigation** – Natural push/pop behavior matches user expectations
- **MiniPlayer overlay** – Single persistent instance avoids duplication
- **Type-safe routing** – `RootStackParamList` ensures correct navigation params

### 3. API Layer

**Location**: [src/services/api.ts](src/services/api.ts)

RESTful client wrapping **JioSaavn Community API** (`https://saavn.sumit.co`):

```typescript
searchSongs(query, page, limit)         // Returns: { results: Song[], count: number }
searchArtists(query, page, limit)       // Returns: { results: Artist[], count: number }
searchPlaylists(query, page, limit)     // Returns: { results: Playlist[], count: number }
getArtistSongs(artistId, page, limit)   // Returns: { results: Song[], count: number }
getPlaylistSongs(playlistId, page)      // Returns: { results: Song[], count: number }
```

**Design Rationale**:
- **Abstraction** – Hides API complexity from UI components
- **Error handling** – Returns success/error status in response
- **Caching-ready** – Easy to add response caching layer later
- **Pagination** – Built-in page/limit params for infinite scroll support

### 4. Persistence Layer

**Location**: [src/services/storage.ts](src/services/storage.ts)

AsyncStorage wrapper managing 7 keys:

| Key | Type | Purpose |
|-----|------|---------|
| `musync_queue` | `QueueItem[]` | Full queue state |
| `musync_currentIndex` | `number` | Current song position in queue |
| `musync_shuffle` | `boolean` | Shuffle mode enabled |
| `musync_repeat` | `'off'\|'one'\|'all'` | Repeat mode |
| `musync_volume` | `number` | Volume level (0–1) |
| `musync_recentlyPlayed` | `Song[]` | Play history |
| `musync_downloads` | `{ [songId]: url }` | Downloaded track file paths |

**Design Rationale**:
- **Scoped keys** – Prevents collisions with other apps
- **Type-safe helpers** – `getObject()`, `setObject()` handle JSON serialization
- **Automatic sync** – Store actions call `storageService.setObject()` after mutations
- **Lazy restore** – `loadPersistedState()` called once on app launch

### 5. Performance Optimization

**HomeScreen FlatList Optimizations**:

1. **Memoized render functions**:
   ```typescript
   const renderSongItem = useCallback(({ item }) => {...}, [currentSong?.id, isPlaying])
   const renderEmptyState = useCallback(() => {...}, [searchQuery, errorMessage])
   const renderFooter = useCallback(() => {...}, [songs, isLoading, page])
   ```

2. **Memoized card components** (avoid re-renders on parent update):
   ```typescript
   const RecentCard = React.memo(({ item, onPress }) => {...})
   const ArtistCard = React.memo(({ item, onPress }) => {...})
   const PlaylistCard = React.memo(({ item, onPress }) => {...})
   ```

3. **FlatList props** (reduce rendering overhead):
   ```typescript
   maxToRenderPerBatch={10}              // Render 10 items per batch
   initialNumToRender={10}               // Initial viewport items
   updateCellsBatchingPeriod={50}        // Batch updates every 50ms
   removeClippedSubviews={true}          // Remove off-screen items from memory
   ```

**Result**: Smooth 60 FPS scrolling even with 100+ songs; `VirtualizedList` warning eliminated.

---

## 💻 Usage Guide

### Searching
1. **HomeScreen loads** with initial "arijit" search
2. **Type in search bar** (debounced 500ms)
3. **Results appear**: Recently Played, Artists, Playlists, then Songs
4. **Tap "Load More"** button at bottom to fetch next 20 songs

### Playing Music
- **Tap a song** → Plays immediately, added to queue
- **Tap artist/playlist card** → Opens detail screen
- **Tap "+" icon** (on artist/playlist songs) → Adds to queue without playing
- **Mini player** → Shows current track; tap to open full player
- **Full player** → Volume, seek, shuffle, repeat, download controls

### Queue Management
1. **Open Queue** (header button with counter badge)
2. **Remove song** → Tap trash icon
3. **Reorder song** → Use ↑/↓ chevron buttons
4. **Clear all** → Swipe or tap clear button
5. **Changes persist** instantly to AsyncStorage

### Downloading Tracks
1. **Play any track** (search, artist screen, or playlist)
2. **Open full Player screen** (tap mini player)
3. **Tap cloud-download icon** (bottom right)
4. **File saves** locally (320 kbps if available)
5. **Future plays** reuse cached file (no re-download)

---

## ⚙️ Configuration & Customization

### Theme (Colors, Typography, Spacing)
**File**: [src/constants/theme.ts](src/constants/theme.ts)

```typescript
export const colors = {
  primary: '#1E90FF',        // Ocean blue (Spotify-inspired)
  background: '#0F0F13',
  surface: '#1A1A1E',
  card: '#242428',
  text: '#FFFFFF',
  textSecondary: '#8A8A8E',
  border: '#3A3A42',
  error: '#FF6B6B',
};
```

Edit these to rebrand the entire app instantly.

### API Endpoint
**File**: [src/services/api.ts](src/services/api.ts)

```typescript
const BASE_URL = 'https://saavn.sumit.co';  // Change to custom proxy if needed
```

### Pagination Limit
**File**: [src/screens/HomeScreen.tsx](src/screens/HomeScreen.tsx)

```typescript
musicApi.searchSongs(query, pageNum, 20)  // Change 20 to different limit
```

---

## ⚖️ Trade-offs & Design Decisions

### 1. **AsyncStorage vs. MMKV**
| Aspect | AsyncStorage | MMKV |
|--------|--------------|------|
| **Pros** | Works with Expo Go, no native modules | Faster, better for large datasets |
| **Cons** | Slower (JSON serialization) | Requires custom dev client |
| **Choice** | ✅ AsyncStorage |
| **Rationale** | Expo Go compatibility is crucial for quick testing |

### 2. **JioSaavn Community API vs. Spotify**
| Aspect | JioSaavn | Spotify |
|--------|----------|---------|
| **Pros** | Free, no auth, instant setup | Official, stable, legal |
| **Cons** | No SLA, may break anytime | OAuth complexity, rate limits |
| **Choice** | ✅ JioSaavn (for demo) |
| **Rationale** | Learning project; use Spotify for production apps |

### 3. **Per-Track Downloads vs. Full Offline**
| Aspect | Per-Track | Full Library |
|--------|-----------|-------------|
| **Pros** | Simple UX, no bulk storage | True offline mode |
| **Cons** | No full offline, manual | Complex sync, storage burden |
| **Choice** | ✅ Per-Track |
| **Rationale** | Balances UX simplicity with practical offline support |

### 4. **Zustand vs. Redux/MobX**
| Framework | Bundle Size | Boilerplate | Learning Curve |
|-----------|-------------|-------------|-----------------|
| **Zustand** | ~2KB | Minimal | Low |
| **Redux** | ~10KB | High | High |
| **MobX** | ~15KB | Medium | Medium |
| **Choice** | ✅ Zustand |
| **Rationale** | Perfect fit for small-to-medium apps with minimal overhead |

### 5. **Manual "Load More" vs. Infinite Scroll**
| Approach | UX | Performance | API Load |
|----------|----|----|---|
| **Manual Button** | Explicit | Better (batched loads) | Lower |
| **Infinite Scroll** | Seamless | Accidental fetches possible | Higher |
| **Choice** | ✅ Manual Button |
| **Rationale** | Clear intent, prevents unnecessary API calls |

### 6. **Single Queue vs. Multiple Playlists**
| Aspect | Single Queue | Multiple Playlists |
|--------|------|--------|
| **Pros** | Simple mental model | Rich features |
| **Cons** | Limited flexibility | Complex state |
| **Choice** | ✅ Single Queue |
| **Rationale** | Cleaner for v1; can extend with playlist management later |

### 7. **Local Storage vs. Cloud Sync**
| Approach | Setup | User Experience | Cross-Device |
|----------|-------|---|---|
| **Local** | None | Instant | ❌ No |
| **Cloud** | Backend needed | Synced | ✅ Yes |
| **Choice** | ✅ Local |
| **Rationale** | Standalone demo; add Firebase/Supabase for production |

### 8. **No Automatic Retry Logic**
| Approach | Code Complexity | Network Resilience |
|----------|---|---|
| **No Retry** | Simple | Low (fails on error) |
| **Exponential Backoff** | Medium | High (retries intelligently) |
| **Choice** | ✅ No Retry |
| **Rationale** | Keep v1 lean; add retry middleware in v2 |

### 9. **No DRM / License Enforcement**
| Aspect | No DRM | Full DRM |
|--------|--------|----------|
| **Use Case** | Learning/personal | Commercial distribution |
| **Complexity** | Zero | High |
| **Legal** | Demo only | Production-safe |
| **Choice** | ✅ No DRM |
| **⚠️ Warning** | **Not suitable for App Store/Play Store distribution** |

---

## 🐛 Known Limitations

1. **JioSaavn API Dependency** – Community API has no SLA; may break anytime
2. **No Cloud Sync** – Queue/settings are device-local only
3. **Limited Error Handling** – Network errors show text, no retry UI
4. **Dark Theme Only** – No light mode toggle
5. **No Album Results** – API has albums, but UI filters them out
6. **Fixed Download Quality** – Always 320 kbps; no quality selection
7. **Manual Download** – No bulk/playlist download; per-track only
8. **Not Production-Ready** – JioSaavn content is copyrighted; for learning only

---

## 🚀 Future Enhancements

- [ ] Spotify Web API integration (official, production-ready)
- [ ] Playlist creation & management
- [ ] Search history with auto-suggestions
- [ ] Lyrics display synced with playback
- [ ] 10-band equalizer with presets
- [ ] Gesture controls (swipe to skip, double-tap to like)
- [ ] Share queue as links
- [ ] Smart shuffle (genre/mood-based)
- [ ] Dark/Light theme toggle
- [ ] Voice search with speech-to-text
- [ ] Multi-user collaborative queues
- [ ] Podcast support alongside music

---

## 📚 Learning Resources

- [Expo Docs](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Zustand](https://github.com/pmndrs/zustand)
- [expo-av](https://docs.expo.dev/versions/latest/sdk/av/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JioSaavn Community API](https://github.com/sumitkolhe/jiosaavn-api)

---

## 📄 License & Credits

- **This Project** – Educational demo (not for distribution)
- **JioSaavn Content** – Copyrighted; API by [sumitkolhe](https://github.com/sumitkolhe/jiosaavn-api)
- **Icons** – Ionicons (Expo Icon Library)
- **Built With** – Expo, React Native, TypeScript, Zustand

**Enjoy building and learning! 🎵**
"# MuSync" 
