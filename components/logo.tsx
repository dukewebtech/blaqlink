import Image from "next/image"

export function Logo({ variant = "default" }: { variant?: "default" | "white" }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/blaqora-icon.png" alt="" width={34} height={34} className="rounded-[10px]" priority />
      <Image
        src={variant === "white" ? "/blaqora-wordmark-white.png" : "/blaqora-wordmark-blue.png"}
        alt="Blaqora"
        width={98}
        height={26}
        className="h-[25px] w-auto"
        priority
      />
    </div>
  )
}
