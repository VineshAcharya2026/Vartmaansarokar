import React, { useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';

interface PageProps {
  number: string;
  children: React.ReactNode;
}

const Page = React.forwardRef<HTMLDivElement, PageProps>((props, ref) => {
  return (
    <div ref={ref} className="bg-white shadow-lg">
      <div className="h-full flex flex-col">
        {props.children}
        <span className="absolute bottom-4 right-4 text-xs text-gray-400">
          {props.number}
        </span>
      </div>
    </div>
  );
});

Page.displayName = 'Page';

interface MagazineFlipbookProps {
  pages: string[];
  pdfUrl?: string;
  title?: string;
}

export const MagazineFlipbook: React.FC<MagazineFlipbookProps> = ({
  pages,
  pdfUrl,
  title
}) => {
  const flipBookRef = useRef<any>(null);

  if (!pages || pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No pages available</p>
      </div>
    );
  }

  return (
    <div className="magazine-flipbook-container">
      {title && (
        <h2 className="text-2xl font-bold text-center mb-6 text-[#001f3f]">
          {title}
        </h2>
      )}

      <div className="flex flex-col items-center">
        <HTMLFlipBook
          ref={flipBookRef}
          width={400}
          height={570}
          size="fixed"
          minWidth={300}
          maxWidth={400}
          minHeight={428}
          maxHeight={570}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          className="magazine-flipbook"
          style={{ margin: '0 auto' }}
          startPage={0}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={true}
          startZIndex={0}
          autoSize={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {pages.map((pageUrl, index) => (
            <Page key={index} number={`${index + 1}`}>
              <img
                src={pageUrl}
                alt={`Page ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </Page>
          ))}
        </HTMLFlipBook>

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#800000] text-white rounded-lg font-bold hover:bg-red-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M12 18v-6" />
              <path d="M9 15l3 3 3-3" />
            </svg>
            Download PDF
          </a>
        )}
      </div>
    </div>
  );
};

export default MagazineFlipbook;
