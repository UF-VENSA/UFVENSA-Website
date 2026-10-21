import { useState } from 'react';

const vensaLogo = '/vensa-logo.png';

/** A failed event asset falls back once; a missing logo cannot recurse. */
export default function EventImage({ src, alt, imageType = 'photo' }) {
  const [failedSource, setFailedSource] = useState(null);
  const displayedSource = failedSource === src ? vensaLogo : (src || vensaLogo);
  const isArtwork = displayedSource === vensaLogo || imageType === 'artwork';

  return (
    <img
      src={displayedSource}
      alt={alt}
      className={isArtwork ? 'event-image-artwork' : 'event-image-photo'}
      onError={() => {
        if (displayedSource !== vensaLogo) setFailedSource(src);
      }}
    />
  );
}
