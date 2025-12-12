"""
Rule data model.
"""
from dataclasses import dataclass
from typing import Optional
import uuid

@dataclass
class Rule:
    """Represents a user-defined categorization rule."""
    content: str
    rule_id: Optional[str] = None
    rule_type: str = 'both'  # 'credit', 'debit', or 'both'
    
    def __post_init__(self):
        """Generate ID if not provided."""
        if not self.rule_id:
            self.rule_id = str(uuid.uuid4())
            
    def to_dict(self) -> dict:
        """Convert rule to dictionary."""
        return {
            'id': self.rule_id,
            'content': self.content,
            'type': self.rule_type
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Rule':
        """Create Rule from dictionary."""
        return cls(
            content=data.get('content', ''),
            rule_id=data.get('id'),
            rule_type=data.get('type', 'both')
        )
