import React from 'react';
import { Sidebar } from './Sidebar';
import type { Collection } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  collections: Collection[];
  selectedCollectionId: string | null | undefined;
  onSelectCollection: (id: string | null | undefined) => void;
  onCreateCollection: (name: string) => void;
  onEditCollection: (id: string, name: string) => void;
  onDeleteCollection: (id: string) => void;
  onDrop?: (e: React.DragEvent, collectionId: string | null) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  collections,
  selectedCollectionId,
  onSelectCollection,
  onCreateCollection,
  onEditCollection,
  onDeleteCollection,
  onDrop
}) => {
  return (
    <div className="h-screen w-full bg-[#F3F4F6] dark:bg-neutral-950 p-4 transition-colors duration-200 overflow-hidden">
      <div className="flex gap-4 items-start h-full">
        <aside className="flex-shrink-0 w-[260px] h-full bg-white dark:bg-neutral-900 rounded-2xl border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] overflow-hidden z-20 transition-colors duration-200">
          <Sidebar
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={onSelectCollection}
            onCreateCollection={onCreateCollection}
            onEditCollection={onEditCollection}
            onDeleteCollection={onDeleteCollection}
            onDrop={onDrop}
          />
        </aside>
        <main className="flex-1 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-sm rounded-2xl border border-white/50 dark:border-neutral-800/50 shadow-sm h-full transition-colors duration-200 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-6 lg:p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
