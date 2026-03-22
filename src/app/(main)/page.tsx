import HomeFeed from '@/components/HomeFeed';
import { StructuredData } from '@/components/StructuredData';

export default function HomePage() {
  return (
    <>
      <StructuredData type="WebSite" />
      <HomeFeed />
    </>
  );
}
