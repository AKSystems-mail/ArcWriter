import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatLine } from '../utils/formatUtils';
import CritiqueSidebar from './CritiqueSidebar';
import { db } from '../firebase'; // Import firebase db instance
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Import firestore functions

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

const ScriptEditor = () => {
  const [blocks, setBlocks] = useState([
    { id: generateId(), type: 'Scene Heading', text: 'INT. STARTING POINT - DAY' },
    { id: generateId(), type: 'Action', text: '' }
  ]);
  
  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const [aiFeedbackMessages, setAiFeedbackMessages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [logicScore, setLogicScore] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(true); // Assume saved initially
  const lastSavedBlocksRef = useRef(blocks); // To compare changes for auto-save

  const blockRefs = useRef({});

  // Helper to get Firestore document reference for the current script
  const getDocumentRef = useCallback(() => {
    // TODO: Replace with dynamic user/universe/project IDs
    const userId = "testuser";
    const universeName = "default"; 
    const projectId = "operation_blackout"; // This project ID is used in backend for BibleManager
    return doc(db, `users/${userId}/universes/${universeName}/projects/${projectId}/script/content`);
  }, []);

  // Save function
  const saveScriptToFirestore = useCallback(async (currentBlocks) => {
    setIsSaving(true);
    setIsSaved(false); // Indicate that saving is in progress
    try {
      const scriptRef = getDocumentRef();
      await setDoc(scriptRef, { blocks: currentBlocks });
      lastSavedBlocksRef.current = currentBlocks; // Update last saved state
      setIsSaved(true);
      console.log("Script saved to Firestore!");
    } catch (error) {
      console.error("Error saving script to Firestore:", error);
      setIsSaved(false); // Indicate save failed
    } finally {
      setIsSaving(false);
    }
  }, [getDocumentRef]);

  // Load function
  const loadScriptFromFirestore = useCallback(async () => {
    try {
      const scriptRef = getDocumentRef();
      const docSnap = await getDoc(scriptRef);
      if (docSnap.exists()) {
        const loadedBlocks = docSnap.data().blocks;
        setBlocks(loadedBlocks);
        lastSavedBlocksRef.current = loadedBlocks; // Initialize last saved state
        setIsSaved(true);
        console.log("Script loaded from Firestore!");
      } else {
        console.log("No script found in Firestore, starting new.");
      }
    } catch (error) {
      console.error("Error loading script from Firestore:", error);
      // Optionally, set an error message in UI
    }
  }, [getDocumentRef]);

  // Initial load effect
  useEffect(() => {
    loadScriptFromFirestore();
  }, [loadScriptFromFirestore]);

  // Auto-save effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Deep comparison to check if blocks have actually changed
      if (JSON.stringify(blocks) !== JSON.stringify(lastSavedBlocksRef.current)) {
        console.log("Changes detected, auto-saving...");
        saveScriptToFirestore(blocks);
      }
    }, 5000); // Save every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [blocks, saveScriptToFirestore]); // Re-run effect if blocks or save function changes

  const updateBlock = (id, updates) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    setIsSaved(false); // Mark as unsaved on change
  };

  const handleTextChange = (id, text, type) => {
    const { text: formattedText } = formatLine(type, text);
    updateBlock(id, { text: formattedText });
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentBlock = blocks[index];
      let nextType = 'Action';

      if (currentBlock.type === 'Scene Heading') nextType = 'Action';
      if (currentBlock.type === 'Character') nextType = 'Dialogue';
      if (currentBlock.type === 'Dialogue') nextType = 'Character';
      if (currentBlock.type === 'Parenthetical') nextType = 'Dialogue';

      const newBlock = { id: generateId(), type: nextType, text: '' };
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
      setIsSaved(false); // Mark as unsaved on new block
      
      setTimeout(() => {
        if (blockRefs.current[newBlock.id]) {
          blockRefs.current[newBlock.id].focus();
        }
      }, 0);
    }
    
    if (e.key === 'Backspace' && blocks[index].text === '' && blocks.length > 1) {
       e.preventDefault();
       const newBlocks = blocks.filter(b => b.id !== blocks[index].id);
       setBlocks(newBlocks);
       setIsSaved(false); // Mark as unsaved on block deletion
       setTimeout(() => {
         const prevBlock = blocks[index - 1];
         if (prevBlock && blockRefs.current[prevBlock.id]) {
           blockRefs.current[prevBlock.id].focus();
         }
       }, 0);
    }
  };

  const handleFormatChange = (newFormat) => {
    if (focusedBlockId) {
      const block = blocks.find(b => b.id === focusedBlockId);
      if (block) {
        const { text: formattedText } = formatLine(newFormat, block.text);
        updateBlock(focusedBlockId, { type: newFormat, text: formattedText });
      }
    }
  };

  const handleAnalyzeSceneRequest = useCallback(async (persona: string) => {
    setIsAnalyzing(true);
    setAiFeedbackMessages((prev) => [...prev, `[USER] Analyze scene as ${persona}...`]);
    setLogicScore(null); // Reset score when new analysis starts

    // Ensure script is saved before analyzing if there are unsaved changes
    if (!isSaved) {
        await saveScriptToFirestore(blocks);
    }

    const scriptText = blocks.map(block => block.text).join('\n');

    try {
      const response = await fetch('http://localhost:8000/critique', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ persona, scene_text: scriptText }), // Removed universe_name and project_id for now as CritiqueSidebar does not pass them
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get critique from backend');
      }

      const data = await response.json();
      setAiFeedbackMessages((prev) => [...prev, `[AI] ${data.critique}`]);
      setLogicScore(data.score);
    } catch (error) {
      console.error("Error analyzing scene:", error);
      setAiFeedbackMessages((prev) => [...prev, `[ERROR] ${error.message || 'An unknown error occurred.'}`]);
      setLogicScore(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [blocks, isSaved, saveScriptToFirestore]);

  const activeFormat = blocks.find(b => b.id === focusedBlockId)?.type || 'Action';

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
        {/* Saved Indicator */}
        <div className="absolute top-4 right-4 z-50 p-2 text-sm font-semibold rounded-md bg-gray-700 text-gray-300">
            {isSaving ? (
                <span className="text-yellow-400">Saving...</span>
            ) : isSaved ? (
                <span className="text-green-400">Saved</span>
            ) : (
                <span className="text-red-400">Unsaved Changes</span>
            )}
        </div>

      <div className="flex-1 flex flex-col"> 
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-800" onClick={() => {
          if (blocks.length > 0) {
          }
        }}>
          <div className="w-full max-w-[8.5in] min-h-[11in] bg-white shadow-2xl p-[1in] mb-8 relative flex flex-col">
            {blocks.map((block, index) => {
              const { className } = formatLine(block.type, block.text);
              return (
                <textarea
                  key={block.id}
                  ref={el => blockRefs.current[block.id] = el}
                  value={block.text}
                  onChange={(e) => handleTextChange(block.id, e.target.value, block.type)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={() => setFocusedBlockId(block.id)}
                  className={`overflow-hidden ${className}`}
                  placeholder={block.type === 'Scene Heading' ? 'INT. LOCATION - TIME' : ''}
                  rows={1}
                  style={{ height: 'auto', minHeight: '1.5em' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="h-16 bg-obsidian-black border-t border-gray-700 flex items-center justify-center gap-4 px-4 z-50">
          <FormatButton 
            label="Scene Heading" 
            shortcut="1" 
            isActive={activeFormat === 'Scene Heading'} 
            onClick={() => handleFormatChange('Scene Heading')}
          />
          <FormatButton 
            label="Action" 
            shortcut="2" 
            isActive={activeFormat === 'Action'} 
            onClick={() => handleFormatChange('Action')}
          />
          <FormatButton 
            label="Character" 
            shortcut="3" 
            isActive={activeFormat === 'Character'} 
            onClick={() => handleFormatChange('Character')}
          />
          <FormatButton 
            label="Dialogue" 
            shortcut="4" 
            isActive={activeFormat === 'Dialogue'} 
            onClick={() => handleFormatChange('Dialogue')}
          />
          <div className="w-px h-8 bg-gray-700 mx-2"></div>
           <FormatButton 
            label="Parenthetical" 
            shortcut="5" 
            isActive={activeFormat === 'Parenthetical'} 
            onClick={() => handleFormatChange('Parenthetical')}
          />
        </div>
      </div>
      
      <CritiqueSidebar onAnalyzeScene={handleAnalyzeSceneRequest} messages={aiFeedbackMessages} isAnalyzing={isAnalyzing} score={logicScore} />
    </div>
  );
};

const FormatButton = ({ label, shortcut, isActive, onClick }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`
      relative px-4 py-2 rounded-md font-medium text-sm transition-all duration-200
      ${isActive 
        ? 'bg-arc-teal text-black shadow-[0_0_10px_rgba(0,206,201,0.4)]' 
        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
      }
    `}
  >
    {label}
    <span className="ml-2 text-xs opacity-50 bg-black/20 px-1.5 py-0.5 rounded">
      CMD+{shortcut}
    </span>
  </button>
);

export default ScriptEditor;