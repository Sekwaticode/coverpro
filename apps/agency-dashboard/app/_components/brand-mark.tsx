import Image from "next/image";

export function BrandMark() {
  return (
    <Image
      src="/coverpro-logo.png"
      alt=""
      width={36}
      height={36}
      priority
      className="h-9 w-9 shrink-0 rounded-full"
    />
  );
}
