interface LivNowLogoProps {
  className?: string;
}

export default function LivNowLogo({ className = '' }: LivNowLogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width="160" height="48" viewBox="0 0 160 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="12" y="32" fontFamily="Poppins, sans-serif" fontSize="32" fontWeight="400" fill="#307584">
          <tspan>Liv</tspan>
          <tspan fill="#307584">N</tspan>
          <tspan fill="#D4A843">o</tspan>
          <tspan fill="#307584">w</tspan>
        </text>
        <circle cx="113" cy="22" r="6" fill="#D4A843" opacity="0.9" />
      </svg>
      <span className="text-xs text-gray-400 -mt-1 italic font-source-sans-3">it's a good move..</span>
    </div>
  );
}
