// A phone can't reach "localhost" on your computer. Set EXPO_PUBLIC_API_HOST to
// your computer's LAN IP (for example 192.168.1.50) in mobile-app/.env.
// For Expo web on the same computer, "localhost" works.
const HOST = process.env.EXPO_PUBLIC_API_HOST || "localhost";

export const TABLE_URL = `http://${HOST}:8001`;
export const MENU_URL = `http://${HOST}:8002`;
export const ORDER_URL = `http://${HOST}:8003`;
export const PAYMENT_URL = `http://${HOST}:8004`;
