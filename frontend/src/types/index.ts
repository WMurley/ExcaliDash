export interface Drawing {
  id: string;
  name: string;
  elements: any[];
  appState: any;
  collectionId: string | null;
  updatedAt: number;
  createdAt: number;
  preview?: string;
}

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
}
