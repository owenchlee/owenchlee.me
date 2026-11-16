import { useEffect, useRef, useState } from 'react';

// Plain inline SVG (not an icon font glyph) so it stays crisp and needs no
// extra asset.
function MailIcon({ className, size }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

// Copying rather than linking out to a mailto: means the address shows up
// as plain readable text and a click gets it onto the clipboard without
// launching whatever mail client is registered on the visitor's machine.
export function CopyEmailButton({ email, buttonClass, iconClass, iconSize, hideIconWhenCopied }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className={buttonClass} onClick={handleClick}>
      {!(hideIconWhenCopied && copied) && <MailIcon className={iconClass} size={iconSize} />}
      {copied ? 'Copied!' : email}
    </button>
  );
}
