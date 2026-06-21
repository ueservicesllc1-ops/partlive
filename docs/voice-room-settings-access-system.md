# Voice Room Settings & Access System

Detailed overview of the improved room configuration and access security system.

## Room Settings

### Categories
Users can select from standard preset categories:
- Música, Karaoke, Fiesta, Juegos, Conversación, Talentos, Cristiana, Podcast, Debate, Amigos, Privada, VIP.

### Countries & Languages
- Integrated list of 30 countries and 9 languages.
- Allows users to search and select via picker modals.
- Recommends Spanish and English at the top.

### Microphone Limits & Unlimited Listeners
- Capped at 2, 4, 6 or 8 microphones.
- Listeners are completely unlimited. The interface displays an explanatory banner and dynamically draws the exact configured slot count.

---

## Room Access Security

### Visibility
- **Public**: Visible in public lists and search results.
- **Private**: Hidden or restricted entry.
- **VIP**: Restricts entry to VIP members only.

### Access Types
1. **Open**: Anyone can join immediately.
2. **Password**: Requires entering a matching passcode. Validation is performed against the backend.
3. **Approval**: Creates a `RoomAccessRequest` that hosts can approve or reject.
4. **Invite Only**: Only invited users can enter.

---

## Room Bans & Moderation

- **Kick**: Immediately removes the user from the room members collection, logging a temporary event.
- **Ban**: Permanently locks out the user. Ban checks are performed by the backend first. If a blocked user attempts to rejoin, the interface halts entry and shows a clear "Estás bloqueado de esta sala" error warning.

---

## How to Run & Verify

### Start Backend
```bash
cd backend
npm run dev
```

### Start Admin Panel
```bash
cd admin
npm run dev
```

### Run Android Application
```bash
npx react-native run-android
```
