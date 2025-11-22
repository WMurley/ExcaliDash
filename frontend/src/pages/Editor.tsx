import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Excalidraw, convertToExcalidrawElements } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import debounce from 'lodash/debounce';
import { Toaster, toast } from 'sonner';
import * as api from '../api';
import { useTheme } from '../context/ThemeContext';

export const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [drawingName, setDrawingName] = useState('Drawing Editor');
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [initialData, setInitialData] = useState<any>(null);
  
  // Refs for API interaction
  const excalidrawAPI = useRef<any>(null);

  // ------------------------------------------------------------------
  // 1. STABLE SAVE LOGIC (The Fix)
  // We use a Ref to hold the save function so the debounce wrapper
  // doesn't need to be recreated on every render.
  // ------------------------------------------------------------------
  const saveDataRef = useRef<(elements: any, appState: any) => Promise<void>>(null);

  // Update the ref on every render to ensure it has access to the latest props/state
  saveDataRef.current = async (elements, appState) => {
    if (!id) return;
    
    try {
      const persistableAppState = {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
      };
      
      await api.updateDrawing(id, {
        elements,
        appState: persistableAppState,
      });
    } catch (err) {
      console.error('Failed to save drawing', err);
      toast.error("Failed to save changes");
    }
  };

  // Create the debounced function ONLY ONCE.
  // It simply calls whatever is currently in saveDataRef.current
  const debouncedSave = useCallback(
    debounce((elements, appState) => {
      if (saveDataRef.current) {
        saveDataRef.current(elements, appState);
      }
    }, 1000),
    [] // Empty dependency array = Stable across renders
  );

  // ------------------------------------------------------------------
  // 2. DATA LOADING
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const data = await api.getDrawing(id);
        setDrawingName(data.name);
        
        setInitialData({
          elements: convertToExcalidrawElements(data.elements || []),
          appState: {
            ...data.appState,
            collaborators: new Map(),
          },
          scrollToContent: true,
        });
      } catch (err) {
        console.error('Failed to load drawing', err);
      }
    };
    loadData();
  }, [id]);

  // ------------------------------------------------------------------
  // 3. HANDLERS
  // ------------------------------------------------------------------
  
  // Hijack Ctrl+S to save immediately
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (excalidrawAPI.current && saveDataRef.current) {
          const elements = excalidrawAPI.current.getSceneElements();
          const appState = excalidrawAPI.current.getAppState();
          // Call save immediately, bypassing debounce
          await saveDataRef.current(elements, appState);
          toast.success("Saved changes to server");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCanvasChange = (elements: readonly any[], appState: any) => {
    // Trigger the stable debounced save
    debouncedSave(elements, appState);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && id) {
      setDrawingName(newName);
      setIsRenaming(false);
      try {
        await api.updateDrawing(id, { name: newName });
      } catch (err) {
        console.error("Failed to rename", err);
      }
    }
  };

  // Disable native Excalidraw save dialogs
  const UIOptions = {
    canvasActions: {
      saveToActiveFile: false,
      loadScene: false,
      export: { saveFileToDisk: false },
      toggleTheme: true,
    },
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-950 overflow-hidden">
      <header className="h-14 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center px-4 justify-between z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full text-gray-600 dark:text-gray-300">
            <ArrowLeft size={20} />
          </button>

          {isRenaming ? (
            <form onSubmit={handleRenameSubmit}>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => setIsRenaming(false)}
                className="font-medium text-gray-900 dark:text-white bg-transparent px-2 py-1 border-2 border-indigo-500 rounded-md outline-none"
              />
            </form>
          ) : (
            <h1
              className="font-medium text-gray-900 dark:text-white px-2 py-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded cursor-text"
              onDoubleClick={() => { setNewName(drawingName); setIsRenaming(true); }}
            >
              {drawingName}
            </h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status indicator removed */}
        </div>
      </header>

      <div className="flex-1 w-full relative" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <Excalidraw
          theme={theme === 'dark' ? 'dark' : 'light'}
          initialData={initialData}
          onChange={handleCanvasChange}
          excalidrawAPI={(api) => (excalidrawAPI.current = api)}
          UIOptions={UIOptions}
        />
        <Toaster position="bottom-center" />
      </div>
    </div>
  );
};
