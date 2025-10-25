
import React from 'react';

interface CMSContentProps {
  content: string;
  className?: string;
}

const CMSContent: React.FC<CMSContentProps> = ({ content, className = '' }) => {
  return (
    <div 
      className={`cms-content ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default CMSContent;
