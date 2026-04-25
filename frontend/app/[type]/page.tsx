import { HomePageView } from "@/components/home/HomePageView";
import { FILE_TYPE_PATH_SEGMENTS, isValidTypeSegment } from "@/lib/file-type-routes";
import { notFound } from "next/navigation";

/** 仅允许四个主库类型，便于静态导出预渲染全部分支 */
export const dynamicParams = false;

export function generateStaticParams() {
  return FILE_TYPE_PATH_SEGMENTS.map((type) => ({ type }));
}

type PageProps = {
  params: Promise<{ type: string }>;
};

export default async function FileTypeHomePage({ params }: PageProps) {
  const { type } = await params;
  if (!isValidTypeSegment(type)) {
    notFound();
  }
  return <HomePageView />;
}
