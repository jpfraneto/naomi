import queryString from 'query-string';

export function getPublicUrl() {
    
   const returnable = "https://poiesis.anky.bot"
  return returnable
}

export function addActionLink(params: {
  name?: string;
  postUrl: `/${string}`;
}) {
  const { postUrl } = params;
  const qs = queryString.stringify(
    {
      url: `${getPublicUrl()}${postUrl}`,
    },
    {
      skipEmptyString: true,
      skipNull: true,
    },
  );

  const addActionLink = `https://warpcast.com/~/add-cast-action?${qs}`;
  console.log(addActionLink);
  return addActionLink;
}
