import React from 'react';

export const GenerateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
    <path d="M16 3h2a2 2 0 0 1 2 2v2" />
    <path d="M2 8V6a2 2 0 0 1 2-2h2" />
    <path d="M8 21H6a2 2 0 0 1-2-2v-2" />
    <path d="M22 16v-2a2 2 0 0 0-2-2h-2" />
    <path d="M9 15l-1-1" />
    <path d="m16 8-1-1" />
    <path d="M12 3-2 13l4 4 10-10" />
  </svg>
);
