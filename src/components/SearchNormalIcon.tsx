import searchNormalSrc from '@/assets/icons/search-normal.png';

type SearchNormalIconProps = {
  className?: string;
  /** Display size in CSS pixels (width and height). */
  size?: number;
};

/** LivNow search asset for header and list search fields. */
export default function SearchNormalIcon({ className = '', size = 20 }: SearchNormalIconProps) {
  return (
    <img
      src={searchNormalSrc}
      alt=""
      width={size}
      height={size}
      className={`pointer-events-none shrink-0 object-contain ${className}`}
      draggable={false}
      aria-hidden
    />
  );
}
