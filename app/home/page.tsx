"use client";

import Image from "next/image";

export default function HomePage(){
  return(
    <Image
      src="/campus-bg.png"
      alt="Meneses Campus"
      fill
      priority
      className="object-fill"
    />

    
  );
}
