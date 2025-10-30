from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class TreeNodeSchema(BaseModel):
    value: Any
    left: Optional[Any] = None
    right: Optional[Any] = None

class TreeSessionBase(BaseModel):
    session_name: str = Field(..., min_length=1, max_length=100)
    tree_type: str = Field(default="binary", pattern="^(binary|bst|avl|heap)$")
    description: Optional[str] = None

class TreeSessionCreate(TreeSessionBase):
    tree_data: Optional[Dict[str, Any]] = Field(default_factory=dict)

class TreeSessionUpdate(BaseModel):
    session_name: Optional[str] = Field(None, min_length=1, max_length=100)
    tree_type: Optional[str] = Field(None, pattern="^(binary|bst|avl|heap)$")
    tree_data: Optional[Dict[str, Any]] = None
    description: Optional[str] = None

class TreeSessionResponse(TreeSessionBase):
    id: str
    user_id: str
    tree_data: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class TreeOperationRequest(BaseModel):
    operation: str = Field(..., pattern="^(insert|delete|search|clear|traverse)$")
    value: Optional[Any] = None
    node_id: Optional[str] = None
    position: Optional[str] = Field(None, pattern="^(left|right|root)$")
    traversal_type: Optional[str] = Field(None, pattern="^(inorder|preorder|postorder|levelorder)$")

class TreeOperationResponse(BaseModel):
    success: bool
    message: str
    tree_data: Optional[Dict[str, Any]] = None
    highlighted_nodes: Optional[List[str]] = None
