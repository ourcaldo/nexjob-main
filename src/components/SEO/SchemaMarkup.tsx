import React, { useEffect, useState } from 'react';

interface SchemaMarkupProps {
  schema: object | object[];
}

const SchemaMarkup: React.FC<SchemaMarkupProps> = ({ schema }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render on server to prevent hydration mismatch
  if (!isClient) {
    return null;
  }

  const schemaArray = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {schemaArray.map((schemaObj, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaObj, null, 0)
          }}
        />
      ))}
    </>
  );
};

export default SchemaMarkup;