import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatLine } from '../utils/formatUtils';
import CritiqueSidebar from './CritiqueSidebar';
import SourceMaterialDrawer from './SourceMaterialDrawer';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

console.log("ScriptEditor loaded. Auth:", auth);

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

const ScriptEditor = ({ universeId, projectId }) => {
  const [blocks, setBlocks] = useState([
    { id: generateId(), type: 'Scene Heading', text: 'INT. STARTING POINT - DAY' },
    { id: generateId(), type: 'Action', text: '' }
  ]);

  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const [aiFeedbackMessages, setAiFeedbackMessages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logicScore, setLogicScore] = useState(null);
  const [analysisOverlays, setAnalysisOverlays] = useState({});
  const [sceneDynamics, setSceneDynamics] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const lastSavedBlocksRef = useRef(blocks);

  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState(false);
  const [sourceContent, setSourceContent] = useState('');
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [isMagicMenuOpen, setIsMagicMenuOpen] = useState(false);

  const blockRefs = useRef({});

  // Helper to get Firestore document reference for the current script
  const getDocumentRef = useCallback(() => {
    // Path must match backend: universes/{universe_id}/projects/{project_id}
    return doc(db, 'universes', universeId, 'projects', projectId, 'script', 'content');
  }, [universeId, projectId]);

  // Helper to get Project Ref for Source Material
  const getProjectRef = useCallback(() => {
    // Path must match backend: universes/{universe_id}/projects/{project_id}
    return doc(db, 'universes', universeId, 'projects', projectId);
  }, [universeId, projectId]);

  // Load Source Material (Bible Content)
  useEffect(() => {
    const fetchSourceMaterial = async () => {
      try {
        const projectRef = getProjectRef();
        const docSnap = await getDoc(projectRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Prioritize the specific source_material field, fallback to bible_content
          setSourceContent(data.source_material || data.bible_content || "No source material available.");
        }
      } catch (error) {
        console.error("Error loading source material:", error);
      }
    };
    fetchSourceMaterial();
  }, [getProjectRef]);

  // Save function
  const saveScriptToFirestore = useCallback(async (currentBlocks) => {
    setIsSaving(true);
    setIsSaved(false);
    try {
      const scriptRef = getDocumentRef();
      await setDoc(scriptRef, { blocks: currentBlocks });
      lastSavedBlocksRef.current = currentBlocks;
      setIsSaved(true);
      console.log("Script saved to Firestore!");
    } catch (error) {
      console.error("Error saving script to Firestore:", error);
      setIsSaved(false);
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
        if (loadedBlocks && Array.isArray(loadedBlocks) && loadedBlocks.length > 0) {
          setBlocks(loadedBlocks);
          lastSavedBlocksRef.current = loadedBlocks;
          setIsSaved(true);
          console.log("Script loaded from Firestore!");
        } else {
          console.log("Script found but empty/invalid, keeping default.");
        }
      } else {
        console.log("No script found in Firestore, starting new.");
      }
    } catch (error) {
      console.error("Error loading script from Firestore:", error);
    }
  }, [getDocumentRef]);

  // Initial load effect
  useEffect(() => {
    loadScriptFromFirestore();
  }, [loadScriptFromFirestore]);

  // Auto-save effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (JSON.stringify(blocks) !== JSON.stringify(lastSavedBlocksRef.current)) {
        console.log("Changes detected, auto-saving...");
        saveScriptToFirestore(blocks);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [blocks, saveScriptToFirestore]);

  const updateBlock = (id, updates) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    setIsSaved(false);
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
      setIsSaved(false);

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
      setIsSaved(false);
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

  const handleInsertSourceMaterial = (text) => {
    // Create a new action block with the inserted text
    const newBlock = { id: generateId(), type: 'Action', text: text };
    const newBlocks = [...blocks];

    let insertIndex = blocks.length;
    if (focusedBlockId) {
      const index = blocks.findIndex(b => b.id === focusedBlockId);
      if (index !== -1) insertIndex = index + 1;
    }

    newBlocks.splice(insertIndex, 0, newBlock);
    setBlocks(newBlocks);
    setIsSaved(false);
  };

  const handleSuggestDialogue = async () => {
    setIsMagicMenuOpen(false);
    setIsGeneratingScene(true);

    try {
      // Get last 5 blocks for context
      const context = blocks.slice(-5).map(b => b.text).join('\n');
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch('/api/script/suggest_dialogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ context })
      });

      if (!response.ok) throw new Error('Failed to get suggestion');
      
      const data = await response.json();
      if (data.suggestion) {
        const newBlock = { id: generateId(), type: 'Dialogue', text: data.suggestion };
        setBlocks(prev => [...prev, newBlock]);
        setIsSaved(false);
        setAiFeedbackMessages(prev => [...prev, '[AI] Dialogue suggestion added!']);
      }
    } catch (error) {
      console.error('Error suggesting dialogue:', error);
      alert('Dialogue suggestion failed.');
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const handleMagicWand = async () => {
    setIsMagicMenuOpen(false);
    const hasContent = blocks.some(block =>
      block.text.trim() !== '' &&
      block.text !== 'INT. STARTING POINT - DAY'
    );

    if (hasContent) {
      const shouldReplace = window.confirm('This will replace your current scene. Continue?');
      if (!shouldReplace) return;
    }

    setIsGeneratingScene(true);

    try {
      const projectRef = getProjectRef();
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) throw new Error('Project not found');

      const projectData = projectSnap.data();
      const beatSheet = projectData.beat_sheet_data || projectData.beat_sheet || {};
      const characters = projectData.characters || [];

      const characterNames = characters.map(char => char.name || char.character_name || 'Unknown');

      let beatContext = 'A dramatic scene';
      const beatKeys = Object.keys(beatSheet);
      if (beatKeys.length > 0) {
        const firstBeatWithContent = beatKeys.find(key => beatSheet[key]);
        if (firstBeatWithContent) {
          beatContext = `${firstBeatWithContent}: ${beatSheet[firstBeatWithContent]}`;
        }
      }

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/script/generate_scene', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          beat_context: beatContext,
          characters: characterNames.length > 0 ? characterNames : ['Character A', 'Character B'],
          game_theory_type: "Prisoner's Dilemma"
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate scene');
      }

      const data = await response.json();
      const generatedBlocks = data.blocks || [];

      const blocksWithIds = generatedBlocks.map(block => ({
        ...block,
        id: generateId()
      }));

      if (blocksWithIds.length > 0) {
        setBlocks(blocksWithIds);
        setIsSaved(false);
        setAiFeedbackMessages(prev => [...prev, '[AI] Scene generated successfully!']);
      } else {
        throw new Error('No content generated');
      }

    } catch (error) {
      console.error('Error generating scene:', error);
      setAiFeedbackMessages(prev => [...prev, `[ERROR] ${error.message}`]);
      alert(`Failed to generate scene: ${error.message}`);
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const handleAnalyzeSceneRequest = useCallback(async (persona) => {
    setIsAnalyzing(true);
    setAiFeedbackMessages((prev) => [...prev, `[USER] Analyze scene as ${persona}...`]);
    setLogicScore(null);

    if (!isSaved) {
      await saveScriptToFirestore(blocks);
    }

    const scriptText = blocks.map(block => block.text).join('\n');

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/critique', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          persona, 
          scene_text: scriptText,
          universe_name: universeId,
          project_id: projectId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get critique from backend');
      }

      const data = await response.json();
      setAiFeedbackMessages((prev) => [...prev, `[AI] ${data.critique}`]);
      setLogicScore(data.score);

      if (data.tension_curve) {
        setAnalysisOverlays({}); // Clear old overlays
        setSceneDynamics(data);
      }
    } catch (error) {
      console.error("Error analyzing scene:", error);
      setAiFeedbackMessages((prev) => [...prev, `[ERROR] ${error.message || 'An unknown error occurred.'}`]);
      setLogicScore(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [blocks, isSaved, saveScriptToFirestore, universeId, projectId]);

  const activeFormat = blocks.find(b => b.id === focusedBlockId)?.type || 'Action';

  return (
    <div className="flex h-screen bg-black overflow-hidden selection:bg-arc-teal/30">
      <SourceMaterialDrawer
        isOpen={isSourceDrawerOpen}
        onToggle={() => setIsSourceDrawerOpen(!isSourceDrawerOpen)}
        content={sourceContent}
        onInsert={handleInsertSourceMaterial}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-12 bg-obsidian-black flex flex-col items-center custom-scrollbar">
          <div className="script-page">
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

                  className={className}
                  placeholder={block.type === 'Scene Heading' ? 'INT. LOCATION - TIME' : ''}
                  rows={1}
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-4 px-6 z-50">
          <FormatButton
            label="Slug"
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
            label="Char"
            shortcut="3"
            isActive={activeFormat === 'Character'}
            onClick={() => handleFormatChange('Character')}
          />
          <FormatButton
            label="Dial"
            shortcut="4"
            isActive={activeFormat === 'Dialogue'}
            onClick={() => handleFormatChange('Dialogue')}
          />
          <FormatButton
            label="Par"
            shortcut="5"
            isActive={activeFormat === 'Parenthetical'}
            onClick={() => handleFormatChange('Parenthetical')}
          />
          
          <div className="w-px h-8 bg-gray-800 mx-2"></div>
          
          <div className="relative">
            <button
              onClick={() => setIsMagicMenuOpen(!isMagicMenuOpen)}
              disabled={isGeneratingScene}
              className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-2"
            >
              {isGeneratingScene ? 'Thinking...' : 'Magic Wand'}
              <ChevronRight className={`w-4 h-4 transition-transform ${isMagicMenuOpen ? 'rotate-90' : ''}`} />
            </button>

            {isMagicMenuOpen && (
              <div className="absolute bottom-full mb-4 right-0 w-56 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                <button
                  onClick={handleMagicWand}
                  className="w-full text-left p-4 hover:bg-purple-600/20 text-white text-xs font-bold uppercase tracking-widest border-b border-gray-800 transition-colors"
                >
                  Auto-Write Scene
                </button>
                <button
                  onClick={handleSuggestDialogue}
                  className="w-full text-left p-4 hover:bg-purple-600/20 text-white text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Suggest Dialogue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CritiqueSidebar
        onAnalyzeScene={handleAnalyzeSceneRequest}
        messages={aiFeedbackMessages}
        isAnalyzing={isAnalyzing}
        score={logicScore}
        dynamics={sceneDynamics}
        totalLines={blocks.length}
        isSaving={isSaving}
        isSaved={isSaved}
      />
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
