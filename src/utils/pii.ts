export function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return email;
  }

  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

export function maskPhone(phone: string) {
  const clean = phone.replace(/\D/g, "");

  if (clean.length < 4) {
    return phone;
  }

  return `${"*".repeat(Math.max(clean.length - 4, 4))}${clean.slice(-4)}`;
}
