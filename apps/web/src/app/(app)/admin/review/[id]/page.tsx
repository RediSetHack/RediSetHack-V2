import { ReviewDetail } from "../review-detail";

export default async function AdminReviewDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <ReviewDetail id={id} />;
}
