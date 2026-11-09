# Talqa w Nos · طلقة ونص
Run `npm start` with Node 22 or later, then open localhost:3000. For phones on the same Wi-Fi use the computer's LAN address on port 3000. Create a room and share its invitation. Guests enter their own names. Each browser tab retains its player session on refresh.
  
On Replit import this directory as the project root and publish as a Reserved VM with the included .replit file. Share the resulting HTTPS URL. One server process owns all rooms. Rooms are held in memory and expire after two hours without requests or when the process restarts. Skipped turns advance after 45 seconds when clients next poll. Run npm test for the ten-player engine check.
