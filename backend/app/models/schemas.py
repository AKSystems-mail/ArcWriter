from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

def generate_id():
    return str(uuid.uuid4())

class Character(BaseModel):
    id: str = Field(default_factory=generate_id)
    name: str
    description: Optional[str] = None
    archetype: Optional[str] = None

class Universe(BaseModel):
    id: str = Field(default_factory=generate_id)
    name: str
    description: Optional[str] = None
    world_rules: List[str] = Field(default_factory=list, description="List of physical or magical rules of this universe")
    character_master_list: List[Character] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Script(BaseModel):
    id: str = Field(default_factory=generate_id)
    project_id: str
    title: str
    version: int = 1
    content: Optional[str] = None # Full text content if needed

class Project(BaseModel):
    id: str = Field(default_factory=generate_id)
    universe_id: str
    title: str
    logline: str
    genre: str
    project_bible_content: str = Field(..., description="Markdown content of the project bible")
    scripts: List[Script] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Scene(BaseModel):
    id: str = Field(default_factory=generate_id)
    script_id: str
    scene_number: int
    location: str
    time_of_day: str
    action: str = Field(..., description="Descriptive action text")
    dialogue: List[Dict[str, str]] = Field(default_factory=list, description="List of {character: line} dicts")
    game_theory_score: float = Field(..., description="Calculated score representing conflict intensity (0.0 - 1.0)")
    analysis_notes: Optional[str] = None
