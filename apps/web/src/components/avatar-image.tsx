"use client";

/* eslint-disable @next/next/no-img-element -- remote image hosts are admin-controlled and unknown to Next config */
export function AvatarImage({ src }: Readonly<{ src: string }>) {
  return (
    <img
      key={src}
      src={src}
      alt=""
      onError={(event) => {
        event.currentTarget.hidden = true;
      }}
      className="size-full bg-white object-cover"
    />
  );
}
