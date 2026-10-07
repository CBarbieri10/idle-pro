import { prisma } from "@/lib/prisma";
import { VideoGalleryClient } from "./video-gallery-client";

export default async function VideosPage() {
  const clips = await prisma.videoLink.findMany({
    include: {
      athlete: true,
      match: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Central de Vídeos Táticos</h1>
        <p className="text-zinc-400 mt-2">Repositório global de recortes de performance.</p>
      </header>
      <VideoGalleryClient initialClips={clips} />
    </div>
  );
}
