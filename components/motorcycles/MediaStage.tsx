import { ImageGallery } from "./ImageGallery";
import type { Motorcycle } from "@/types/motorcycle";

export function MediaStage({ m }: { m: Motorcycle }) {
  return <ImageGallery m={m} />;
}
