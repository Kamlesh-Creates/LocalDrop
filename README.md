# LocalDrop

LocalDrop is a local-network file and text sharing app built with Next.js, TypeScript, Tailwind CSS, and Socket.IO.

## Features

- Random device name on join
- Live connected device list
- Text messages between devices on the same LAN
- Drag-and-drop or file picker file sharing
- Toast notifications for incoming messages and files
- Runs on a local IP address like `http://192.168.x.x:3000`

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open the app from the device running the server or from another device on the same Wi-Fi using the machine's LAN IP, for example:

```text
http://192.168.1.25:3000
```

## Build and start

```bash
npm run build
npm run start
```

## Environment

Copy `.env.example` to `.env.local` if you want to override the default port or host.

## Notes

- LocalDrop does not require internet access.
- Transferred files are kept in memory only while devices are connected.