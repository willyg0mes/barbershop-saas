import { Linking } from "react-native";

export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length >= 10 && !digits.startsWith("55")) {
    return `55${digits}`;
  }

  return digits;
}

export async function openWhatsApp(phone: string, message: string): Promise<void> {
  const normalized = normalizeWhatsAppPhone(phone);
  await Linking.openURL(
    `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`,
  );
}
