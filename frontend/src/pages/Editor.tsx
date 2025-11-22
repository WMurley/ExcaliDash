import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Excalidraw, convertToExcalidrawElements, exportToSvg } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { Toaster, toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { getUserIdentity } from '../utils/identity';
import { reconcileElements } from '../utils/sync';
import type { UserIdentity } from '../utils/identity';
import * as api from '../api';
import { useTheme } from '../context/ThemeContext';

interface Peer extends UserIdentity {
  isActive: boolean;
}

interface ElementVersionInfo {
  version: number;
  versionNonce: number;
}

// Move UIOptions outside to prevent re-creation on every render
const UIOptions = {
  canvasActions: {
    saveToActiveFile: false,
    loadScene: false,
    export: { saveFileToDisk: false },
    toggleTheme: true,
  },
};

export const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [drawingName, setDrawingName] = useState('Drawing Editor');
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [initialData, setInitialData] = useState<any>(null);
  
  const [peers, setPeers] = useState<Peer[]>([]);
  const [me] = useState(getUserIdentity());
  const [isReady, setIsReady] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const lastCursorEmit = useRef<number>(0);
  const elementVersionMap = useRef<Map<string, ElementVersionInfo>>(new Map());
  const isSyncing = useRef(false);
  const cursorBuffer = useRef<Map<string, any>>(new Map());
  const animationFrameId = useRef<number>(0);

  const recordElementVersion = useCallback((element: any) => {
    elementVersionMap.current.set(element.id, {
      version: element.version ?? 0,
      versionNonce: element.versionNonce ?? 0,
    });
  }, []);

  const hasElementChanged = useCallback((element: any) => {
    const previous = elementVersionMap.current.get(element.id);
    if (!previous) return true;

    const nextVersion = element.version ?? 0;
    const nextNonce = element.versionNonce ?? 0;

    return previous.version !== nextVersion || previous.versionNonce !== nextNonce;
  }, []);

  useEffect(() => {
    if (!id || !isReady) return;

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('join-room', { drawingId: id, user: me });

    // Start the render loop for cursors
    const renderLoop = () => {
      if (cursorBuffer.current.size > 0 && excalidrawAPI.current) {
        const collaborators = new Map(excalidrawAPI.current.getAppState().collaborators || []);
        
        cursorBuffer.current.forEach((data, userId) => {
           collaborators.set(userId, data);
        });
        
        cursorBuffer.current.clear();
        excalidrawAPI.current.updateScene({ collaborators });
      }
      animationFrameId.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    socket.on('presence-update', (users: Peer[]) => {
      setPeers(users.filter(u => u.id !== me.id));
      
      // Update collaborators map to remove inactive users
      if (excalidrawAPI.current) {
        const collaborators = new Map(excalidrawAPI.current.getAppState().collaborators || []);
        users.forEach(user => {
          if (!user.isActive && user.id !== me.id) {
            collaborators.delete(user.id);
          }
        });
        excalidrawAPI.current.updateScene({ collaborators });
      }
    });

    socket.on('cursor-move', (data: any) => {
       // Just buffer the data
       cursorBuffer.current.set(data.userId, {
          pointer: data.pointer,
          button: data.button || 'up',
          selectedElementIds: data.selectedElementIds || {},
          username: data.username,
          avatarUrl: data.avatarUrl,
          color: { background: data.color, stroke: data.color },
          id: data.userId,
       });
    });

    socket.on('element-update', ({ elements }: { elements: any[] }) => {
      if (!excalidrawAPI.current) return;
      
      isSyncing.current = true;

      // 3. THE SELECTION GUARD (Fixes Dragging/Snap-back)
      // Get IDs of elements YOU are currently holding
      const currentAppState = excalidrawAPI.current.getAppState();
      const mySelectedIds = currentAppState.selectedElementIds || {};

      // Filter out updates for elements you are currently dragging
      // This prevents the server from pulling the object out of your hand
      const validRemoteElements = elements.filter((el: any) => !mySelectedIds[el.id]);

      const localElements = excalidrawAPI.current.getSceneElementsIncludingDeleted();
      const mergedElements = reconcileElements(localElements, validRemoteElements);
      
      // Update version map with remote versions to avoid echoing
      validRemoteElements.forEach((el: any) => {
        recordElementVersion(el);
      });
      
      excalidrawAPI.current.updateScene({ elements: mergedElements });
      isSyncing.current = false;
    });

    // Activity Tracking
    const handleActivity = (isActive: boolean) => {
      socket.emit('user-activity', { drawingId: id, isActive });
    };

    const onFocus = () => handleActivity(true);
    const onBlur = () => handleActivity(false);
    const onMouseEnter = () => handleActivity(true);
    const onMouseLeave = () => handleActivity(false);

    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseleave', onMouseLeave);
      socket.off('presence-update');
      socket.off('cursor-move');
      socket.off('element-update');
      socket.disconnect();
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [id, me, isReady, recordElementVersion]);

  const onPointerUpdate = useCallback((payload: any) => {
    const now = Date.now();
    if (now - lastCursorEmit.current > 50 && socketRef.current) {
      socketRef.current.emit('cursor-move', {
        pointer: payload.pointer,
        button: payload.button,
        username: me.name,
        userId: me.id,
        drawingId: id,
        color: me.color
      });
      lastCursorEmit.current = now;
    }
  }, [id, me]);
  
  // Refs for API interaction
  const excalidrawAPI = useRef<any>(null);
  
  const setExcalidrawAPI = useCallback((api: any) => {
    excalidrawAPI.current = api;
    setIsReady(true);
  }, []);

  // ------------------------------------------------------------------
  // 1. STABLE SAVE LOGIC (The Fix)
  // We use a Ref to hold the save function so the debounce wrapper
  // doesn't need to be recreated on every render.
  // ------------------------------------------------------------------
  const saveDataRef = useRef<(elements: any, appState: any) => Promise<void>>(null);
  const savePreviewRef = useRef<(elements: any, appState: any, files: any) => Promise<void>>(null);

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

  savePreviewRef.current = async (elements, appState, files) => {
    if (!id) return;

    try {
      // Generate preview
      const svg = await exportToSvg({
        elements,
        appState: {
          ...appState,
          exportBackground: true,
          viewBackgroundColor: appState.viewBackgroundColor || '#ffffff',
        },
        files,
      });
      const preview = svg.outerHTML;

      await api.updateDrawing(id, { preview });
    } catch (err) {
      console.error('Failed to save preview', err);
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

  const debouncedSavePreview = useCallback(
    debounce((elements, appState, files) => {
      if (savePreviewRef.current) {
        savePreviewRef.current(elements, appState, files);
      }
    }, 10000),
    []
  );

  const broadcastChanges = useCallback(
    throttle((elements: readonly any[]) => {
      if (!socketRef.current || !id) return;
      
      const changes: any[] = [];

      elements.forEach((el) => {
        if (hasElementChanged(el)) {
          changes.push(el);
          recordElementVersion(el);
        }
      });
      
      if (changes.length > 0) {
        socketRef.current.emit('element-update', {
          drawingId: id,
          elements: changes,
          userId: me.id
        });
      }
    }, 100, { leading: true, trailing: true }),
    [id, hasElementChanged, recordElementVersion]
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
        
        const elements = convertToExcalidrawElements(data.elements || []);
        
        // Initialize version tracking with loaded data
        elements.forEach((el: any) => {
          recordElementVersion(el);
        });

        setInitialData({
          elements,
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
  }, [id, recordElementVersion]);

  // ------------------------------------------------------------------
  // 3. HANDLERS
  // ------------------------------------------------------------------
  
  // Hijack Ctrl+S to save immediately
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (excalidrawAPI.current && saveDataRef.current && savePreviewRef.current) {
          const elements = excalidrawAPI.current.getSceneElements();
          const appState = excalidrawAPI.current.getAppState();
          const files = excalidrawAPI.current.getFiles() || null;
          // Call save immediately, bypassing debounce
          await saveDataRef.current(elements, appState);
          // Also update preview
          savePreviewRef.current(elements, appState, files);
          toast.success("Saved changes to server");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCanvasChange = useCallback((elements: readonly any[], appState: any) => {
    // 4. STOP THE ECHO
    // If this change was caused by a socket update, do NOT broadcast it back
    if (isSyncing.current) return;
    
    // Get ALL elements including deleted (fixes the "deletion not syncing" bug)
    const allElements = excalidrawAPI.current 
      ? excalidrawAPI.current.getSceneElementsIncludingDeleted() 
      : elements;

    // Trigger Sync (Throttled)
    broadcastChanges(allElements);

    // Trigger Fast Save
    debouncedSave(allElements, appState);

    // Trigger Slow Preview Gen
    const files = excalidrawAPI.current?.getFiles() || null;
    debouncedSavePreview(allElements, appState, files);
  }, [debouncedSave, debouncedSavePreview, broadcastChanges]);

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
  // UIOptions is now defined outside the component

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
        
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <div className="relative group">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: me.color }}
              >
                {me.initials}
              </div>
              <div className="absolute top-full mt-2 right-0 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                {me.name} (You)
              </div>
            </div>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
            
            <div className="flex items-center gap-2">
              {peers.map(peer => (
                <div 
                  key={peer.id}
                  className="relative group"
                >
                  <div 
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm transition-all duration-300 ${!peer.isActive ? 'opacity-30 grayscale' : ''}`}
                    style={{ backgroundColor: peer.color }}
                  >
                    {peer.initials}
                  </div>
                  <div className="absolute top-full mt-2 right-0 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {peer.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full relative" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <Excalidraw
          theme={theme === 'dark' ? 'dark' : 'light'}
          initialData={initialData}
          onChange={handleCanvasChange}
          onPointerUpdate={onPointerUpdate}
          excalidrawAPI={setExcalidrawAPI}
          UIOptions={UIOptions}
        />
        <Toaster position="bottom-center" />
      </div>
    </div>
  );
};
