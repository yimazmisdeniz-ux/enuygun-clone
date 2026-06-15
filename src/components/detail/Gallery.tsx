"use client";

import Image from "next/image";
import { useState } from "react";
import { Images, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { useTranslations } from "next-intl";

export function Gallery({
  images,
  totalPhotos,
  name,
}: {
  images: string[];
  totalPhotos: number;
  name: string;
}) {
  const t = useTranslations("Detail");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const thumbs = images.slice(1, 5);

  function openAt(i: number) {
    setIndex(i);
    setOpen(true);
  }
  function move(dir: 1 | -1) {
    setIndex((i) => (i + dir + images.length) % images.length);
  }

  return (
    <Container className="mt-5">
      <div className="grid h-[300px] grid-cols-2 gap-2 md:h-[460px] md:grid-cols-4 md:grid-rows-2">
        {/* Large */}
        <button
          onClick={() => openAt(0)}
          className="relative col-span-2 row-span-2 overflow-hidden rounded-l-lg"
        >
          <Image
            src={images[0]}
            alt={name}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, 560px"
            priority
          />
        </button>

        {/* Thumbs */}
        {thumbs.map((src, i) => {
          const isLast = i === thumbs.length - 1;
          return (
            <button
              key={i}
              onClick={() => openAt(i + 1)}
              className={`relative overflow-hidden ${
                i === 1 ? "rounded-tr-lg" : ""
              } ${isLast ? "rounded-br-lg" : ""}`}
            >
              <Image
                src={src}
                alt={`${name} ${i + 2}`}
                fill
                className="object-cover transition-transform hover:scale-105"
                sizes="(max-width: 768px) 50vw, 280px"
              />
              {isLast && (
                <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 text-sm font-semibold text-white">
                  <Images className="h-5 w-5" />{t("gallery.morePhotos", { count: totalPhotos })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            aria-label={t("close")}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            onClick={() => setOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <button
            aria-label={t("previous")}
            className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            onClick={(e) => {
              e.stopPropagation();
              move(-1);
            }}
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <div
            className="relative h-[80vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[index]}
              alt={`${name} ${index + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
          <button
            aria-label={t("next")}
            className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            onClick={(e) => {
              e.stopPropagation();
              move(1);
            }}
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>
      )}
    </Container>
  );
}
