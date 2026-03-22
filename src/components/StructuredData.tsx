interface TVSeriesSchemaProps {
  type: 'TVSeries';
  name: string;
  description: string;
  image: string;
  genre: string;
  numberOfEpisodes: number;
}

interface WebSiteSchemaProps {
  type: 'WebSite';
}

type StructuredDataProps = TVSeriesSchemaProps | WebSiteSchemaProps;

export function StructuredData(props: StructuredDataProps) {
  let schema: object;

  if (props.type === 'TVSeries') {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'TVSeries',
      name: props.name,
      description: props.description,
      image: props.image,
      genre: props.genre,
      numberOfEpisodes: props.numberOfEpisodes,
      provider: {
        '@type': 'Organization',
        name: 'Gulel OTT',
        url: 'https://thegulel.com',
      },
    };
  } else {
    schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: 'Gulel OTT',
          url: 'https://thegulel.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://thegulel.com/search?q={search_term}',
            'query-input': 'required name=search_term',
          },
        },
        {
          '@type': 'Organization',
          name: 'Gulel Entertainment',
          url: 'https://thegulel.com',
          sameAs: [
            process.env.NEXT_PUBLIC_INSTAGRAM_URL,
            process.env.NEXT_PUBLIC_YOUTUBE_URL,
            process.env.NEXT_PUBLIC_TWITTER_URL,
            process.env.NEXT_PUBLIC_FACEBOOK_URL,
          ].filter(Boolean),
        },
      ],
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
