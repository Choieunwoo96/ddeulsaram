import type { MetadataRoute } from 'next';
import { listRooms } from '@/lib/store';
import { SITE_URL } from '@/lib/site';

// 방 목록은 계속 바뀌니 사이트맵을 매 요청마다 새로 만들지 말고 1시간마다만
// 다시 생성한다 (검색엔진이 자주 가져가도 DB에 매번 부담을 주지 않도록).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/rooms/new`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/match`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.1 },
  ];

  // 방 상세 페이지는 실제 컨텐츠라 검색엔진 노출 가치가 가장 크다.
  let roomRoutes: MetadataRoute.Sitemap = [];
  try {
    const rooms = await listRooms();
    roomRoutes = rooms.map((room) => ({
      url: `${SITE_URL}/rooms/${room.id}`,
      lastModified: room.createdAt ? new Date(room.createdAt) : undefined,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
  } catch {
    // DB 연결 문제 등으로 방 목록을 못 가져와도 사이트맵 전체가 깨지지 않게
    // 정적 경로만이라도 반환한다.
  }

  return [...staticRoutes, ...roomRoutes];
}
